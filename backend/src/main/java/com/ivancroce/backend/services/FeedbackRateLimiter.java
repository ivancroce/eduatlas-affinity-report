package com.ivancroce.backend.services;

import com.ivancroce.backend.exceptions.TooManyRequestsException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
public class FeedbackRateLimiter {

    private static final long BUCKET_IDLE_EVICT_MS = Duration.ofMinutes(5).toMillis();

    static class BucketEntry {
        final Bucket bucket;
        final AtomicLong lastAccessMs = new AtomicLong(System.currentTimeMillis());

        BucketEntry(Bucket bucket) {
            this.bucket = bucket;
        }
    }

    final ConcurrentHashMap<String, BucketEntry> ipBuckets = new ConcurrentHashMap<>();
    private final Bucket globalDailyBucket = buildGlobalBucket();

    public String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] parts = forwarded.split(",");
            // Take the rightmost value — appended by Koyeb's proxy.
            // The client controls leftmost entries and can spoof them freely.
            return parts[parts.length - 1].trim();
        }
        String addr = request.getRemoteAddr();
        // Normalize IPv6 loopback so local dev uses one bucket, not two
        return ("0:0:0:0:0:0:0:1".equals(addr) || "::1".equals(addr)) ? "127.0.0.1" : addr;
    }

    public void checkAllowed(String ip) {
        // Global daily cap checked first — no point checking per-IP if quota is gone
        checkBucket(globalDailyBucket,
                "Daily email quota exceeded. Please try again tomorrow.",
                TimeUnit.HOURS.toSeconds(24));

        BucketEntry entry = ipBuckets.computeIfAbsent(ip, k -> new BucketEntry(buildPerIpBucket()));
        entry.lastAccessMs.set(System.currentTimeMillis());
        checkBucket(entry.bucket,
                "Too many requests from your IP. Please try again in a minute.",
                60L);
    }

    private void checkBucket(Bucket bucket, String message, long fallbackRetryAfterSeconds) {
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long retryAfter = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()) + 1;
            throw new TooManyRequestsException(message, retryAfter > 0 ? retryAfter : fallbackRetryAfterSeconds);
        }
    }

    @Scheduled(fixedRate = 600_000)
    void cleanupStaleBuckets() {
        long cutoff = System.currentTimeMillis() - BUCKET_IDLE_EVICT_MS;
        int removed = 0;
        for (var entry : ipBuckets.entrySet()) {
            if (entry.getValue().lastAccessMs.get() < cutoff) {
                ipBuckets.remove(entry.getKey());
                removed++;
            }
        }
        if (removed > 0) {
            log.debug("Rate limiter: evicted {} stale IP buckets", removed);
        }
    }

    private static Bucket buildPerIpBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(3)
                        .refillIntervally(3, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private static Bucket buildGlobalBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(100)
                        .refillIntervally(100, Duration.ofHours(24))
                        .build())
                .build();
    }
}
