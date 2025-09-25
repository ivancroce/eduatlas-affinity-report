package com.ivancroce.backend.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FeedbackRequest(
        @NotBlank(message = "Feedback type is required")
        @Pattern(regexp = "^(bug|improvement|general)$", message = "Invalid feedback type")
        String feedbackType,

        @NotBlank(message = "Message is required")
        @Size(min = 10, max = 1000, message = "Message must be between 10 and 1000 characters")
        String message,

        @Email(message = "Invalid email format")
        String userEmail,

        @Size(max = 100, message = "Country name too long")
        String country1,

        @Size(max = 100, message = "Country name too long")
        String country2
) {
}