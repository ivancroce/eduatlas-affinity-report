package com.ivancroce.backend.controllers;

import com.ivancroce.backend.config.SecurityConfig;
import com.ivancroce.backend.entities.BachelorProgram;
import com.ivancroce.backend.entities.Country;
import com.ivancroce.backend.payloads.CountryRespDTO;
import com.ivancroce.backend.repositories.BachelorProgramRepository;
import com.ivancroce.backend.services.BachelorProgramService;
import com.ivancroce.backend.services.CountryService;
import com.ivancroce.backend.services.UserService;
import com.ivancroce.backend.tools.JWTTools;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CountryController.class)
@Import(SecurityConfig.class)
class CountryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CountryService countryService;

    @MockBean
    private BachelorProgramService bachelorProgramService;

    @MockBean
    private BachelorProgramRepository bachelorProgramRepository;

    @MockBean
    private JWTTools jwtTools;

    @MockBean
    private UserService userService;

    @Test
    void comparison_validDifferentCodes_returns200() throws Exception {
        Country italy = new Country("Italy", 13, "110/110", "1 ECTS = 25h", "IT");
        Country ireland = new Country("Ireland", 12, "First Class", "1 ECTS = 25h", "IE");
        BachelorProgram program = new BachelorProgram(3, false, 60, 6, "Bachelor of Science", italy);

        given(countryService.findByCountryCode("IT")).willReturn(italy);
        given(countryService.findByCountryCode("IE")).willReturn(ireland);
        given(bachelorProgramService.getRepresentativeProgramForCountry(any())).willReturn(program);
        given(bachelorProgramRepository.existsByCountryIdAndIsSpecialProgramTrue(any())).willReturn(false);

        mockMvc.perform(get("/api/countries/comparison")
                        .servletPath("/api/countries/comparison")
                        .param("c1", "IT")
                        .param("c2", "IE"))
                .andExpect(status().isOk());
    }

    @Test
    void comparison_sameCode_returns400() throws Exception {
        mockMvc.perform(get("/api/countries/comparison")
                        .servletPath("/api/countries/comparison")
                        .param("c1", "IT")
                        .param("c2", "IT"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void comparison_missingC1Param_returns400() throws Exception {
        mockMvc.perform(get("/api/countries/comparison")
                        .servletPath("/api/countries/comparison")
                        .param("c2", "IE"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAllCountries_withoutAuthToken_returns401() throws Exception {
        mockMvc.perform(get("/api/countries")
                        .servletPath("/api/countries"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getCountriesSimple_withoutAuthToken_returns200() throws Exception {
        given(countryService.findAllCountriesSimple()).willReturn(List.of());

        mockMvc.perform(get("/api/countries/simple")
                        .servletPath("/api/countries/simple"))
                .andExpect(status().isOk());
    }
}
