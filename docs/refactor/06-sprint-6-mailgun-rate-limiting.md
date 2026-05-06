# Sprint 6 — Mailgun Rate Limiting on POST /api/feedback

**Branch:** `feature/sprint-6-mailgun-rate-limiting`
**Base:** `develop`

---

## Problem

`POST /api/feedback` is a public, unauthenticated endpoint. Every successful call triggers a Mailgun API request that sends an email to the admin inbox. There is no throttle — a bot (or an impatient user) can:

1. **Exhaust the Mailgun free-tier daily quota** (100 emails/day) in seconds
2. **Spam the admin inbox** continuously from a single IP

Three attack surfaces were identified during implementation and testing:

| # | Attack | Root cause |
|---|---|---|
| 1 | Unlimited submissions with no email | No rate limiter at all |
| 2 | IP bypass via `X-Forwarded-For` spoofing | Reading leftmost (client-controlled) header value |
| 3 | IPv6/IPv4 loopback split giving two separate buckets | `::1` and `127.0.0.1` not normalized |

A fourth apparent bypass ("changing form content unblocks the limit") turned out **not** to be a bug — it was `refillGreedy` returning tokens continuously (1 token every ~20 s). The time spent typing was enough for a token to refill. Fix: switch to `refillIntervally` for a hard window reset.

---

## Fix

Add [Bucket4j](https://bucket4j.com/) (in-memory, no Redis required) to enforce two independent limits before any email is sent. Address all four issues above.

### Rate limit policy

| Bucket | Capacity | Refill mode | Scope |
|---|---|---|---|
| Per-IP | 3 tokens | `refillIntervally(3, 1 min)` — all 3 tokens restored at once at the 1-minute mark | per client IP |
| Global daily | 100 tokens | `refillIntervally(100, 24 h)` — full capacity restored after 24 hours | whole application |

`refillIntervally` vs `refillGreedy`: with `refillGreedy` the bucket drips tokens back continuously (3 tokens / 60 s = 1 token every 20 s). A user who waits 20 s between attempts keeps getting through. With `refillIntervally`, the entire capacity is restored in one shot at the interval boundary — no partial refills.

### IP extraction (anti-spoofing)

When behind a proxy (Koyeb), `HttpServletRequest.getRemoteAddr()` returns the proxy's IP, not the real client IP. Koyeb appends the client IP to the `X-Forwarded-For` header. The header may look like:

```
X-Forwarded-For: spoofed-by-client, real-client-ip, koyeb-proxy-ip
```

The **rightmost** entry is the one Koyeb itself appended — the client cannot forge it. The leftmost entries are client-controlled and spoofable. We take `parts[parts.length - 1].trim()`.

IPv6 loopback normalization: Windows dev boxes send both `::1` (short form) and `0:0:0:0:0:0:0:1` (expanded form) — without normalization these create two separate per-IP buckets in local development. Both are mapped to `"127.0.0.1"`.

### Memory leak prevention

Per-IP buckets are stored in a `ConcurrentHashMap`. Without cleanup, every unique IP that ever hits the endpoint accumulates in memory for the lifetime of the process. On a public site this is a slow DoS vector.

Fix: each map entry is wrapped in a `BucketEntry` that tracks `lastAccessMs` (an `AtomicLong`). A `@Scheduled(fixedRate = 600_000)` method runs every 10 minutes and evicts entries that have been idle for more than 5 minutes. Eviction is safe: after 1 minute idle the per-IP bucket is already fully refilled — removing it is equivalent to a fresh bucket.

`@EnableScheduling` is required on the main application class to activate Spring's task scheduler.

---

## Files changed

### `backend/pom.xml`

Add Bucket4j core dependency (no Spring integration needed — pure in-memory).

```xml
<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.10.1</version>
</dependency>
```

---

### `EduAtlasAffinityReportBackendApplication.java`

**Before:**
```java
@SpringBootApplication
public class EduAtlasAffinityReportBackendApplication { ... }
```

**After:**
```java
@SpringBootApplication
@EnableScheduling
public class EduAtlasAffinityReportBackendApplication { ... }
```

`@EnableScheduling` activates Spring's scheduling infrastructure so `@Scheduled` on `FeedbackRateLimiter.cleanupStaleBuckets()` fires.

---

### `exceptions/TooManyRequestsException.java` *(new)*

Carries `retryAfterSeconds` so the handler can set the `Retry-After` HTTP header accurately.

```java
public class TooManyRequestsException extends RuntimeException {
    private final long retryAfterSeconds;

    public TooManyRequestsException(String message, long retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() { return retryAfterSeconds; }
}
```

---

### `services/FeedbackRateLimiter.java` *(new)*

```java
@Slf4j
@Service
public class FeedbackRateLimiter {

    private static final long BUCKET_IDLE_EVICT_MS = Duration.ofMinutes(5).toMillis();

    static class BucketEntry {
        final Bucket bucket;
        final AtomicLong lastAccessMs = new AtomicLong(System.currentTimeMillis());

        BucketEntry(Bucket bucket) { this.bucket = bucket; }
    }

    final ConcurrentHashMap<String, BucketEntry> ipBuckets = new ConcurrentHashMap<>();
    private final Bucket globalDailyBucket = buildGlobalBucket();

    public String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            // Rightmost = appended by Koyeb proxy; leftmost is client-controlled/spoofable
            return parts[parts.length - 1].trim();
        }
        String addr = request.getRemoteAddr();
        // Normalize both IPv6 loopback forms to avoid split buckets in local dev
        return ("0:0:0:0:0:0:0:1".equals(addr) || "::1".equals(addr)) ? "127.0.0.1" : addr;
    }

    public void checkAllowed(String ip) {
        // Check global cap first — no point checking per-IP if daily quota is gone
        checkBucket(globalDailyBucket, "Daily email quota exceeded. Please try again tomorrow.", TimeUnit.HOURS.toSeconds(24));
        BucketEntry entry = ipBuckets.computeIfAbsent(ip, k -> new BucketEntry(buildPerIpBucket()));
        entry.lastAccessMs.set(System.currentTimeMillis());
        checkBucket(entry.bucket, "Too many requests from your IP. Please try again in a minute.", 60L);
    }

    @Scheduled(fixedRate = 600_000) // every 10 minutes
    void cleanupStaleBuckets() {
        long cutoff = System.currentTimeMillis() - BUCKET_IDLE_EVICT_MS;
        int removed = 0;
        for (var entry : ipBuckets.entrySet()) {
            if (entry.getValue().lastAccessMs.get() < cutoff) {
                ipBuckets.remove(entry.getKey());
                removed++;
            }
        }
        if (removed > 0) log.debug("Rate limiter: evicted {} stale IP buckets", removed);
    }

    private static Bucket buildPerIpBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(3)
                        .refillIntervally(3, Duration.ofMinutes(1)).build())
                .build();
    }

    private static Bucket buildGlobalBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(100)
                        .refillIntervally(100, Duration.ofHours(24)).build())
                .build();
    }
}
```

---

### `controllers/FeedbackController.java`

Inject `FeedbackRateLimiter` + `HttpServletRequest`. Extract IP and call `checkAllowed` after validation, before `mailgunSender`.

**Before:**
```java
public FeedbackRespDTO submitFeedback(@Validated @RequestBody FeedbackRequest request,
                                      BindingResult validationResult) { ... }
```

**After:**
```java
public FeedbackRespDTO submitFeedback(@Validated @RequestBody FeedbackRequest request,
                                      BindingResult validationResult,
                                      HttpServletRequest httpRequest) {
    // validation...
    String ip = rateLimiter.extractIp(httpRequest);
    rateLimiter.checkAllowed(ip);
    mailgunSender.sendFeedbackEmail(...);
}
```

---

### `exceptions/ExceptionsHandler.java`

Add 429 handler returning `ResponseEntity` (not `@ResponseStatus`) so `Retry-After` header can be set on the response.

```java
@ExceptionHandler(TooManyRequestsException.class)
public ResponseEntity<ErrorDTO> handleTooManyRequests(TooManyRequestsException exception) {
    ErrorDTO body = new ErrorDTO(exception.getMessage(), LocalDateTime.now());
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header("Retry-After", String.valueOf(exception.getRetryAfterSeconds()))
            .body(body);
}
```

---

### `tests/services/FeedbackRateLimiterTest.java` *(new)*

#### How to run

```bash
# From backend/
./mvnw test
# or just the rate limiter class:
./mvnw test -Dtest=FeedbackRateLimiterTest
```

No database, no Spring context needed — these are pure unit tests. `FeedbackRateLimiter` has no constructor dependencies (buckets are created inline), so each test instantiates it directly with `new FeedbackRateLimiter()`. `HttpServletRequest` is mocked with Mockito. Tests run in ~400 ms.

#### Why unit tests, not integration tests

The rate limiter's logic is entirely self-contained — it's math on token buckets and string manipulation on headers. A `@SpringBootTest` integration test would spin up Spring, Hibernate, and a database connection for no additional coverage. Unit tests are faster, simpler, and clearer about what they're verifying.

#### JVM warning fix (`pom.xml`)

Mockito on JDK 21 uses a dynamic agent to enable inline mocking. Without opt-in, the JVM prints a wall of warnings about future restrictions. The fix is one `<argLine>` in `maven-surefire-plugin`:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <argLine>-XX:+EnableDynamicAgentLoading</argLine>
    </configuration>
</plugin>
```

This explicitly tells the JVM that dynamic agent loading is expected, making the warnings disappear. No functional behaviour changes.

#### Test breakdown

**`extractIp` (5 tests) — validates IP extraction and anti-spoofing logic**

| Test | What it verifies | Why it matters |
|---|---|---|
| `extractIp_noForwardedHeader_returnsRemoteAddr` | When no `X-Forwarded-For` header is present, falls back to `getRemoteAddr()` | Local dev / direct connections with no proxy |
| `extractIp_singleForwardedEntry_returnsThatEntry` | Single-value XFF header returned as-is | Simple proxy setup |
| `extractIp_multiHopChain_returnsRightmost` | `"spoofed.client, 10.0.0.1, 203.0.113.5"` → `"203.0.113.5"` | The leftmost value is client-controlled — an attacker can prepend any IP to bypass per-IP limits. Only the rightmost value (appended by Koyeb's proxy) is trustworthy |
| `extractIp_ipv6LoopbackShort_normalizesToIpv4` | `"::1"` → `"127.0.0.1"` | Windows JDK can report the local loopback in IPv6 short form |
| `extractIp_ipv6LoopbackLong_normalizesToIpv4` | `"0:0:0:0:0:0:0:1"` → `"127.0.0.1"` | Same address in fully expanded form — without normalization the two forms map to separate buckets, effectively doubling the local limit to 6 requests |

**`checkAllowed` (3 tests) — validates token bucket enforcement**

| Test | What it verifies | Why it matters |
|---|---|---|
| `checkAllowed_allowsUpToThreeRequestsFromSameIp` | 3 consecutive calls from the same IP all succeed without throwing | Confirms the happy path — legitimate users aren't blocked |
| `checkAllowed_blocksFourthRequestFromSameIp` | 4th call throws `TooManyRequestsException` with `retryAfterSeconds > 0` | Core requirement: the limit fires at the right count; the retry value is populated so the frontend can show an accurate countdown |
| `checkAllowed_differentIpsHaveIndependentBuckets` | IP A exhausting its 3 tokens does not affect IP B | Each IP gets its own bucket — one user flooding the form cannot accidentally rate-limit another user |

**`cleanupStaleBuckets` (2 tests) — validates memory leak prevention**

These tests access `ipBuckets` and `BucketEntry.lastAccessMs` directly. Both are package-private so the test class (in the same package `com.ivancroce.backend.services`) can reach them without reflection.

| Test | What it verifies | Why it matters |
|---|---|---|
| `cleanupStaleBuckets_evictsBucketWithExpiredLastAccess` | An entry whose `lastAccessMs` is backdated by 10 min is removed from the map after cleanup runs | Confirms the scheduled eviction actually works — prevents unbounded map growth |
| `cleanupStaleBuckets_keepsFreshBucket` | An entry created just now (default `lastAccessMs`) survives cleanup | Guards against over-aggressive eviction that would delete active buckets and reset someone's limit mid-window |

---

### `frontend/FeedbackModal.jsx`

Add Retry-After countdown UX so users know exactly how long to wait.

**State added:**
- `retryCountdown: number` — seconds remaining; 0 means no active cooldown
- `countdownRef: useRef` — holds the `setInterval` ID for cleanup

**`useEffect`** starts a 1-second countdown whenever `retryCountdown` is set to a non-zero value. Clears on unmount or when countdown reaches 0.

**On 429 response:**
```js
const retryAfter = parseInt(error.response.headers["retry-after"] || "60", 10);
setRetryCountdown(retryAfter);
setErrorMessage(error.response.data?.message || "Too many requests.");
```

**Button behaviour:**
- Disabled when `retryCountdown > 0`
- Label: `"Wait Xs"` during cooldown, `"Sending..."` during in-flight, `"Send Feedback"` normally

**Alert:** shows error message + `"Try again in Xs."` suffix when countdown is active.

---

## What NOT changed

- No other controller, service, or entity touched
- No database schema changes
- No changes to `MailgunSender`
- No Redis, Caffeine, or distributed state — in-memory is sufficient for single-instance Koyeb
- No externalized rate limit config in `application.properties` — values are small constants, no operational need to tune them at deploy time
- No `X-RateLimit-*` response headers — not needed for this use case
- Same-email demo setup (all feedback to one inbox) is intentional — no change
- No Spring profiles introduced

---

## Verification checklist

- [x] `./mvnw test` passes — 11 tests (1 smoke + 10 unit), 0 failures
- [ ] App boots without errors
- [ ] Single feedback submission returns 200 and email arrives in inbox
- [ ] 4th submission from the same IP within the 1-minute window returns 429
- [ ] Browser console shows `Retry-After` in response headers
- [ ] FeedbackModal shows error alert + countdown timer (e.g. "Try again in 58s")
- [ ] Send button disabled and shows "Wait Xs" during countdown
- [ ] After countdown reaches 0, button re-enables and new submission succeeds
- [ ] `GET /api/countries/comparison?c1=IT&c2=IE` still returns 200 (no regression)
- [ ] `POST /api/auth/login` still works (no regression)
