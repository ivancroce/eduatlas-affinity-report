package com.ivancroce.backend.payloads;

import jakarta.validation.constraints.*;

public record CountryRegistrationDTO(
        @NotBlank(message = "Country name is required")
        @Size(min = 2, max = 20, message = "Country name must be between 2 and 20 characters")
        String name,
        @NotNull(message = "Years of compulsory schooling is required")
        @Min(value = 12, message = "Minimum years of compulsory schooling is 12")
        @Max(value = 13, message = "Maximum years of compulsory schooling is 13")
        Integer yearsCompulsorySchooling,
        @NotBlank(message = "Grading system is required")
        @Pattern(regexp = "^.+-.+$", message = "Grading system must follow format: worst-best (e.g., 18-30, F-A)")
        String gradingSystem,
        @NotBlank(message = "Credit ratio is required")
        @Pattern(regexp = "^\\d+(/\\d+)?$",
                message = "Credit ratio must be a number or number/number format (e.g., 30 or 25/30)")
        String creditRatio,
        @NotBlank
        @Size(min = 2, max = 2, message = "Country code is required")
        String countryCode
) {
}
