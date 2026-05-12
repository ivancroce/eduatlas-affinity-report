package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.BachelorProgram;
import com.ivancroce.backend.entities.Country;
import com.ivancroce.backend.exceptions.NotFoundException;
import com.ivancroce.backend.repositories.BachelorProgramRepository;
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
class BachelorProgramServiceTest {

    @Mock
    private BachelorProgramRepository bachelorProgramRepository;

    @Mock
    private CountryRepository countryRepository;

    @InjectMocks
    private BachelorProgramService bachelorProgramService;

    @Test
    void standardProgramFound_returnsIt() {
        Country country = new Country("Italy", 8, "30L/27L", "1:1", "IT");
        BachelorProgram program = new BachelorProgram(3, false, 60, 6, "Laurea Triennale", country);
        when(bachelorProgramRepository.findStandardProgramForCountry(1L, BachelorProgramService.TOTAL_EDUCATION_YEARS))
                .thenReturn(Optional.of(program));

        BachelorProgram result = bachelorProgramService.getRepresentativeProgramForCountry(1L);

        assertThat(result).isSameAs(program);
        verify(bachelorProgramRepository, never()).findLongestProgramForCountry(any());
    }

    @Test
    void standardProgramAbsent_fallsBackToLongest() {
        Country country = new Country("Ireland", 9, "A/B/C/D/E/F", "1:1", "IE");
        BachelorProgram fallback = new BachelorProgram(4, true, 60, 7, "Honours Bachelor", country);
        when(bachelorProgramRepository.findStandardProgramForCountry(2L, BachelorProgramService.TOTAL_EDUCATION_YEARS))
                .thenReturn(Optional.empty());
        when(bachelorProgramRepository.findLongestProgramForCountry(2L))
                .thenReturn(Optional.of(fallback));

        BachelorProgram result = bachelorProgramService.getRepresentativeProgramForCountry(2L);

        assertThat(result).isSameAs(fallback);
    }

    @Test
    void noProgramsFound_throwsNotFoundException() {
        when(bachelorProgramRepository.findStandardProgramForCountry(3L, BachelorProgramService.TOTAL_EDUCATION_YEARS))
                .thenReturn(Optional.empty());
        when(bachelorProgramRepository.findLongestProgramForCountry(3L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> bachelorProgramService.getRepresentativeProgramForCountry(3L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("3");
    }
}
