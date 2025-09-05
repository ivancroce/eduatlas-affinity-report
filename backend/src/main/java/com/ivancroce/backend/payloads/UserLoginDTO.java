package com.ivancroce.backend.payloads;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;

public record UserLoginDTO(
        @Email(message = "The email is not valid")
        @NotEmpty(message = "Email is required")
        String email,
        @NotEmpty(message = "Password is required")
        String password) {
}
