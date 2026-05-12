package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.Country;
import com.ivancroce.backend.exceptions.NotFoundException;
import com.ivancroce.backend.repositories.CountryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CountryServiceTest {

    @Mock
    private CountryRepository countryRepository;

    @InjectMocks
    private CountryService countryService;

    @Test
    void findByCountryCode_knownCode_returnsCountry() {
        Country country = new Country("Italy", 8, "30L/27L", "1:1", "IT");
        when(countryRepository.findByCountryCodeIgnoreCase("IT")).thenReturn(Optional.of(country));

        Country result = countryService.findByCountryCode("IT");

        assertThat(result).isSameAs(country);
    }

    @Test
    void findByCountryCode_unknownCode_throwsNotFoundException() {
        when(countryRepository.findByCountryCodeIgnoreCase("XX")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> countryService.findByCountryCode("XX"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("XX");
    }
}
