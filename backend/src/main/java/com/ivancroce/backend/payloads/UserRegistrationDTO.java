package com.ivancroce.backend.payloads;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record UserRegistrationDTO(@NotEmpty(message = "Username is required.")
                                  @Size(min = 3, max = 20, message = "Username must be between 3 and  20 characters. ")
                                  String username,
                                  @Email(message = "The email is not valid.")
                                  @NotEmpty(message = "Email is required.")
                                  String email,
                                  @NotEmpty(message = "Password is required.")
                                  @Size(min = 6, message = "Password must be at least 6 characters")
                                  String password,
                                  @NotEmpty(message = "First name is required.")
                                  @Size(min = 3, max = 30, message = "The name must be between 3 and 30 characters.")
                                  String firstName,
                                  @NotEmpty(message = "Last name is required.")
                                  @Size(min = 3, max = 30, message = "The surname must have between 3 and 30 characters.")
                                  String lastName) {
}
