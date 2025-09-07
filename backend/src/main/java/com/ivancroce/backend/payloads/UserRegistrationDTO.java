package com.ivancroce.backend.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record UserRegistrationDTO(@NotBlank(message = "Username is required.")
                                  @Size(min = 3, max = 20, message = "Username must be between 3 and  20 characters. ")
                                  String username,
                                  @Email(message = "The email is not valid.")
                                  @NotBlank(message = "Email is required.")
                                  String email,
                                  @NotBlank(message = "Password is required.")
                                  @Size(min = 6, message = "Password must be at least 6 characters")
                                  String password,
                                  @NotBlank(message = "First name is required.")
                                  @Size(min = 2, max = 30, message = "First name must be between 2 and 30 characters")
                                  String firstName,
                                  @NotBlank(message = "Last name is required")
                                  @Size(min = 2, max = 30, message = "Last name must be between 2 and 30 characters")
                                  String lastName) {
}
