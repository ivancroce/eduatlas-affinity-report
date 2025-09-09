package com.ivancroce.backend.payloads;

import jakarta.validation.constraints.*;

public record BachelorRegistrationDTO(
        @NotNull(message = "BA duration is required")
        @Min(value = 1, message = "Minimum BA duration is 1 year")
        @Max(value = 6, message = "Maximum BA duration is 6 years")
        Integer duration,
        Boolean isSpecialProgram,
        @NotNull(message = "Credits per year is required")
        @Min(value = 15, message = "Credits per year must be at least 15")
        @Max(value = 80, message = "Credits per year cannot exceed 80")
        Integer creditsPerYear,
        @NotNull(message = "EQF level is required")
        @Min(value = 1, message = "EQF level must be between 1 and 8")
        @Max(value = 8, message = "EQF level must be between 1 and 8")
        Integer eqfLevel,
        @NotBlank(message = "Official denomination is required")
        @Size(min = 2, max = 50, message = "Country name must be between 2 and 50 characters")
        String officialDenomination,
        @NotNull(message = "Country ID is required")
        Long countryId
) {
}
