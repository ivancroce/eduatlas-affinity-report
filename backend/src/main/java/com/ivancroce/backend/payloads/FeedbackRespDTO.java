package com.ivancroce.backend.payloads;

import java.time.LocalDateTime;

public record FeedbackRespDTO(
        String message,
        String userEmail,
        String feedbackType,
        LocalDateTime timestamp
) {
}
