# Backend Testing Guide

## Overview

The backend test suite lives in `backend/src/test/java/com/ivancroce/backend/`. It is split into two categories:

| Category | Location | What it tests |
|---|---|---|
| **Unit tests** | `services/` | Individual service methods in isolation — no Spring context, no HTTP, no database |
| **Integration tests** | `controllers/` | HTTP layer — request routing, status codes, validation, and the security filter |

All tests run with a single command:

```bash
# From backend/
./mvnw.cmd test          # Windows
./mvnw test              # macOS / Linux / Git Bash
```

To run a single test class:

```bash
./mvnw.cmd test -Dtest=BachelorProgramServiceTest
./mvnw.cmd test -Dtest=CountryControllerTest
```

To run all tests in a package:

```bash
./mvnw.cmd test -Dtest="com.ivancroce.backend.services.*"
./mvnw.cmd test -Dtest="com.ivancroce.backend.controllers.*"
```

---

## Unit Tests (`services/`)

Unit tests use **JUnit 5 + Mockito** with no Spring context. Each test class is annotated with `@ExtendWith(MockitoExtension.class)`. Dependencies are mocked with `@Mock` and injected with `@InjectMocks` — no `@SpringBootTest`, no database, no network.

These tests are fast (< 1 s each) and cover behaviour that is independent of HTTP routing or database queries.

### `FeedbackRateLimiterTest` — 10 tests

Covers `FeedbackRateLimiter.extractIp()` and `checkAllowed()`.

| Test | What it verifies |
|---|---|
| `extractIp_noForwardedHeader_returnsRemoteAddr` | Falls back to `getRemoteAddr()` when no XFF header |
| `extractIp_singleForwardedEntry_returnsThatEntry` | Single-hop XFF returns that IP |
| `extractIp_multiHopChain_returnsRightmost` | Takes rightmost (Koyeb-appended) IP, not client-supplied leftmost |
| `extractIp_ipv6LoopbackShort_normalizesToIpv4` | `::1` maps to `127.0.0.1` |
| `extractIp_ipv6LoopbackLong_normalizesToIpv4` | `0:0:0:0:0:0:0:1` maps to `127.0.0.1` |
| `checkAllowed_allowsUpToThreeRequestsFromSameIp` | Three requests from the same IP are allowed |
| `checkAllowed_blocksFourthRequestFromSameIp` | Fourth request from same IP throws `TooManyRequestsException` with a positive `retryAfterSeconds` |
| `checkAllowed_differentIpsHaveIndependentBuckets` | One exhausted IP does not block a different IP |
| `cleanupStaleBuckets_evictsBucketWithExpiredLastAccess` | Buckets idle for 10+ minutes are removed from the map |
| `cleanupStaleBuckets_keepsFreshBucket` | Recently used buckets are not evicted |

### `AuthServiceTest` — 4 tests

Covers `AuthService.checkEmailBeforeLogin()`.

| Test | What it verifies |
|---|---|
| `validCredentials_returnsToken` | Correct email + password → JWT token returned |
| `wrongPassword_throwsUnauthorizedException` | User exists but password does not match → `UnauthorizedException` |
| `unknownEmail_throwsUnauthorizedException` | Email not in DB → `UnauthorizedException` (not `NotFoundException`) |
| `userEnumeration_wrongPasswordAndUnknownEmail_throwSameMessage` | Both failure cases produce the same exception message — an attacker cannot distinguish "email not found" from "wrong password" |

The fourth test is the most important: it directly verifies the **user enumeration fix** introduced in Sprint 1.

### `BachelorProgramServiceTest` — 3 tests

Covers `BachelorProgramService.getRepresentativeProgramForCountry()` — the core affinity engine input.

| Test | What it verifies |
|---|---|
| `standardProgramFound_returnsIt` | When the standard program exists (duration = 16 − yearsCompulsorySchooling, non-special), it is returned |
| `standardProgramAbsent_fallsBackToLongest` | When no standard program matches, the longest program for the country is returned instead |
| `noProgramsFound_throwsNotFoundException` | When no programs exist at all, `NotFoundException` is thrown |

The fallback-to-longest logic handles edge cases like Poland's 3.5-year engineering degree where the standard formula produces no match.

### `CountryServiceTest` — 2 tests

Covers `CountryService.findByCountryCode()`.

| Test | What it verifies |
|---|---|
| `findByCountryCode_knownCode_returnsCountry` | Known ISO code returns the corresponding `Country` |
| `findByCountryCode_unknownCode_throwsNotFoundException` | Unknown code throws `NotFoundException` |

---

## Integration Tests (`controllers/`)

Integration tests use **`@WebMvcTest`** — a Spring test slice that loads only the web layer (controllers, filters, `@RestControllerAdvice`) without JPA or a database. All service and repository dependencies are replaced with `@MockBean`.

`JWTCheckerFilter` is a `@Component` and is loaded by every `@WebMvcTest`. Its dependencies (`JWTTools`, `UserService`) are mocked so the filter can be instantiated. The filter's `shouldNotFilter()` logic runs normally: public endpoints bypass the filter, protected endpoints receive the real 401 handling.

### `CountryControllerTest` — 5 tests

Covers `CountryController` HTTP behaviour.

| Test | What it verifies |
|---|---|
| `comparison_validDifferentCodes_returns200` | `GET /api/countries/comparison?c1=IT&c2=IE` with mocked services → 200 |
| `comparison_sameCode_returns400` | `GET /api/countries/comparison?c1=IT&c2=IT` → 400 (controller-level guard) |
| `comparison_missingC1Param_returns400` | Missing `c1` query param → 400 (`MissingServletRequestParameterException` handler) |
| `getAllCountries_withoutAuthToken_returns401` | `GET /api/countries` without `Authorization` header → 401 (filter blocks it) |
| `getCountriesSimple_withoutAuthToken_returns200` | `GET /api/countries/simple` without `Authorization` header → 200 (filter is bypassed for public endpoints) |

The last two tests are the **security regression tests**: they verify that the `JWTCheckerFilter` whitelist is working correctly — public endpoints are accessible without a token, and admin endpoints are not.

### `AuthControllerTest` — 3 tests

Covers `AuthController` HTTP behaviour.

| Test | What it verifies |
|---|---|
| `login_validCredentials_returns200WithToken` | Valid credentials → 200 with `accessToken` in response body |
| `login_invalidCredentials_returns401` | `AuthService` throws `UnauthorizedException` → 401 response via `ExceptionsHandler` |
| `login_emptyBody_returns400` | Empty JSON body `{}` → 400 (`@Valid` bean validation failure on blank email/password) |

---

## How tests map to sprints

| Sprint | Feature tested | Test class |
|---|---|---|
| Sprint 1 — User enumeration fix | `AuthService.checkEmailBeforeLogin()` | `AuthServiceTest` |
| Sprint 2 — Representative program selection | `BachelorProgramService.getRepresentativeProgramForCountry()` | `BachelorProgramServiceTest` |
| Sprint 2 — Comparison endpoint validation | `CountryController.getComparison()` | `CountryControllerTest` |
| Sprint 6 — Feedback rate limiting | `FeedbackRateLimiter` | `FeedbackRateLimiterTest` |
| Sprint 7 — JWT filter public/private split | `JWTCheckerFilter.shouldNotFilter()` (via HTTP tests) | `CountryControllerTest` |
| General — Country code lookup | `CountryService.findByCountryCode()` | `CountryServiceTest` |
| General — Auth HTTP contract | `AuthController` | `AuthControllerTest` |

---

## Adding new tests

**New unit test:** create a class in `backend/src/test/java/com/ivancroce/backend/services/`, annotate with `@ExtendWith(MockitoExtension.class)`, `@Mock` each dependency, `@InjectMocks` the class under test. No Spring annotations.

**New controller test:** create a class in `backend/src/test/java/com/ivancroce/backend/controllers/`, annotate with `@WebMvcTest(YourController.class)` and `@Import(SecurityConfig.class)`. Add `@MockBean JWTTools` and `@MockBean UserService` in every controller test (required for `JWTCheckerFilter` to instantiate). Add `@MockBean` for every service/repository the controller depends on.

**Important — `.servletPath()` on every request:** MockMvc does not populate `HttpServletRequest.getServletPath()` the way a real Tomcat container does (it defaults to empty string). `JWTCheckerFilter.shouldNotFilter()` reads `getServletPath()` to decide whether to apply auth. Without an explicit `.servletPath("/api/...")` on the request builder, the filter runs on every request regardless of the whitelist. Always pass `.servletPath(path)` matching the request URI on every `mockMvc.perform(...)` call.

**New security test:** to test that a new admin endpoint correctly requires auth, add a test to the relevant controller test class: call the endpoint without an `Authorization` header and assert `status().isUnauthorized()`. No mock setup needed — the filter handles it before the controller runs.
