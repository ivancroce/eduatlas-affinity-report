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

        @NotNull(message = "BA duration is required")
        @Min(value = 1, message = "Minimum BA duration is 1 year")
        @Max(value = 6, message = "Maximum BA duration is 6 years")
        Integer durationBa,

        @NotNull(message = "Credits per year is required")
        @Min(value = 15, message = "Credits per year must be at least 15")
        @Max(value = 80, message = "Credits per year cannot exceed 80")
         Integer creditsPerYear,

        @NotBlank(message = "Grading system is required")
        @Pattern(regexp = "^.+-.+$", message = "Grading system must follow format: worst-best (e.g., 18-30, F-A)")
        String gradingSystem,

        @NotNull(message = "EQF level is required")
        @Min(value = 1, message = "EQF level must be between 1 and 8")
        @Max(value = 8, message = "EQF level must be between 1 and 8")
        Integer eqfLevel,

        @NotBlank(message = "Official denomination is required")
        @Size(min = 2, max = 50, message = "Country name must be between 2 and 50 characters")
        String officialDenomination
) {
}
