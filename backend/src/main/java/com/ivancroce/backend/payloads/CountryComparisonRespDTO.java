package com.ivancroce.backend.payloads;

import com.ivancroce.backend.entities.BachelorProgram;
import com.ivancroce.backend.entities.Country;

public record CountryComparisonRespDTO(
        Country country1,
        BachelorProgram representativeProgram1,
        boolean hasSpecialProgram1,
        Country country2,
        BachelorProgram representativeProgram2,
        boolean hasSpecialProgram2
) {}
