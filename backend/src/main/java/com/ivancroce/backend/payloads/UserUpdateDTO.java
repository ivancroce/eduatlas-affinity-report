package com.ivancroce.backend.payloads;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record UserUpdateDTO(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
        String username,

        @NotBlank(message = "First name is required")
        @Size(min = 2, max = 30, message = "First name must be between 2 and 30 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(min = 2, max = 30, message = "Last name must be between 2 and 30 characters")
        String lastName,

        @URL(message = "Avatar URL must be valid")
        String avatarUrl
) {}
