package com.ivancroce.backend.services;

import com.ivancroce.backend.exceptions.TooManyRequestsException;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
public class FeedbackRateLimiter {

    private final ConcurrentHashMap<String, Bucket> ipBuckets = new ConcurrentHashMap<>();
    private final Bucket globalDailyBucket = buildGlobalBucket();

    public String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public void checkAllowed(String ip) {
        // Global daily cap checked first — no point checking per-IP if quota is gone
        checkBucket(globalDailyBucket,
                "Daily email quota exceeded. Please try again tomorrow.",
                TimeUnit.HOURS.toSeconds(24));

        Bucket ipBucket = ipBuckets.computeIfAbsent(ip, k -> buildPerIpBucket());
        checkBucket(ipBucket,
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

    private static Bucket buildPerIpBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(3)
                        .refillGreedy(3, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private static Bucket buildGlobalBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(100)
                        .refillGreedy(100, Duration.ofHours(24))
                        .build())
                .build();
    }
}
