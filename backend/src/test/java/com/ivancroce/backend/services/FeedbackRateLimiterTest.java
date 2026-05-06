package com.ivancroce.backend.services;

import com.ivancroce.backend.exceptions.TooManyRequestsException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class FeedbackRateLimiterTest {

    private FeedbackRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new FeedbackRateLimiter();
    }

    // --- extractIp ---

    @Test
    void extractIp_noForwardedHeader_returnsRemoteAddr() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn(null);
        when(req.getRemoteAddr()).thenReturn("1.2.3.4");

        assertThat(rateLimiter.extractIp(req)).isEqualTo("1.2.3.4");
    }

    @Test
    void extractIp_singleForwardedEntry_returnsThatEntry() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn("5.6.7.8");

        assertThat(rateLimiter.extractIp(req)).isEqualTo("5.6.7.8");
    }

    @Test
    void extractIp_multiHopChain_returnsRightmost() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn("spoofed.client, 10.0.0.1, 203.0.113.5");

        assertThat(rateLimiter.extractIp(req)).isEqualTo("203.0.113.5");
    }

    @Test
    void extractIp_ipv6LoopbackShort_normalizesToIpv4() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn(null);
        when(req.getRemoteAddr()).thenReturn("::1");

        assertThat(rateLimiter.extractIp(req)).isEqualTo("127.0.0.1");
    }

    @Test
    void extractIp_ipv6LoopbackLong_normalizesToIpv4() {
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getHeader("X-Forwarded-For")).thenReturn(null);
        when(req.getRemoteAddr()).thenReturn("0:0:0:0:0:0:0:1");

        assertThat(rateLimiter.extractIp(req)).isEqualTo("127.0.0.1");
    }

    // --- checkAllowed ---

    @Test
    void checkAllowed_allowsUpToThreeRequestsFromSameIp() {
        assertThatNoException().isThrownBy(() -> {
            rateLimiter.checkAllowed("10.0.0.1");
            rateLimiter.checkAllowed("10.0.0.1");
            rateLimiter.checkAllowed("10.0.0.1");
        });
    }

    @Test
    void checkAllowed_blocksFourthRequestFromSameIp() {
        rateLimiter.checkAllowed("10.0.0.2");
        rateLimiter.checkAllowed("10.0.0.2");
        rateLimiter.checkAllowed("10.0.0.2");

        assertThatThrownBy(() -> rateLimiter.checkAllowed("10.0.0.2"))
                .isInstanceOf(TooManyRequestsException.class)
                .satisfies(e -> assertThat(((TooManyRequestsException) e).getRetryAfterSeconds()).isPositive());
    }

    @Test
    void checkAllowed_differentIpsHaveIndependentBuckets() {
        rateLimiter.checkAllowed("10.0.0.3");
        rateLimiter.checkAllowed("10.0.0.3");
        rateLimiter.checkAllowed("10.0.0.3");

        assertThatNoException().isThrownBy(() -> rateLimiter.checkAllowed("10.0.0.4"));
    }

    // --- cleanupStaleBuckets ---

    @Test
    void cleanupStaleBuckets_evictsBucketWithExpiredLastAccess() {
        rateLimiter.checkAllowed("10.0.0.5");

        // Backdate the entry's lastAccess to simulate it being idle for 10 minutes
        FeedbackRateLimiter.BucketEntry entry = rateLimiter.ipBuckets.get("10.0.0.5");
        entry.lastAccessMs.set(System.currentTimeMillis() - Duration.ofMinutes(10).toMillis());

        rateLimiter.cleanupStaleBuckets();

        assertThat(rateLimiter.ipBuckets).doesNotContainKey("10.0.0.5");
    }

    @Test
    void cleanupStaleBuckets_keepsFreshBucket() {
        rateLimiter.checkAllowed("10.0.0.6");

        rateLimiter.cleanupStaleBuckets();

        assertThat(rateLimiter.ipBuckets).containsKey("10.0.0.6");
    }
}
