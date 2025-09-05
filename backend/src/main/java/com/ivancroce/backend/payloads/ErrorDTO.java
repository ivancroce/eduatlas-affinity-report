package com.ivancroce.backend.payloads;

import java.time.LocalDateTime;

public record ErrorDTO(String message, LocalDateTime stamp) {
}
