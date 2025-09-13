package com.ivancroce.backend.controllers;

import com.ivancroce.backend.entities.BachelorProgram;
import com.ivancroce.backend.entities.Country;
import com.ivancroce.backend.exceptions.ValidationException;
import com.ivancroce.backend.payloads.CountryRegistrationDTO;
import com.ivancroce.backend.payloads.CountryRespDTO;
import com.ivancroce.backend.repositories.BachelorProgramRepository;
import com.ivancroce.backend.services.BachelorProgramService;
import com.ivancroce.backend.services.CountryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/countries")
public class CountryController {

    @Autowired
    private CountryService countryService;

    @Autowired
    private BachelorProgramService bachelorProgramService;

    @Autowired
    private BachelorProgramRepository bachelorProgramRepository;

    @Operation(summary = "Get a country by ID", description = "Retrieves a single country's details based on its unique identifier.")
    @GetMapping("/{id}")
    public Country getCountryById(@PathVariable Long id) {
        return countryService.findById(id);
    }

    @Operation(summary = "Get simple countries list", description = "Returns list of countries for dropdown selection")
    @GetMapping("/simple")
    public List<CountryRespDTO> getAllCountriesSimple() {
        return countryService.findAllCountriesSimple();
    }

    @Operation(summary = "Get representative program", description = "Get the standard bachelor program for affinity comparison")
    @GetMapping("/{countryId}/representative-program")
    public BachelorProgram getRepresentativeProgram(@PathVariable Long countryId) {
        return bachelorProgramService.getRepresentativeProgramForCountry(countryId);
    }

    @GetMapping("/{countryId}/has-special-program")
    public ResponseEntity<Boolean> hasSpecialPrograms(@PathVariable Long countryId) {
        boolean hasSpecial = bachelorProgramRepository.existsByCountryIdAndIsSpecialProgramTrue(countryId);
        return ResponseEntity.ok(hasSpecial);
    }

    @GetMapping("/{countryId}/bachelor-programs")
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<BachelorProgram> getCountryBachelorPrograms(@PathVariable Long countryId) {
        return bachelorProgramService.findByCountryId(countryId);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public Page<Country> getAllCountries(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        @RequestParam(defaultValue = "id") String sortBy) {
        return countryService.findAllCountries(page, size, sortBy);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('ADMIN')")
    public Country createCountry(@Validated @RequestBody CountryRegistrationDTO dto, BindingResult validationResult) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }
        return countryService.save(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public Country updateCountry(@PathVariable Long id, @RequestBody @Validated CountryRegistrationDTO dto, BindingResult validationResult) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }

        return countryService.findCountryByIdAndUpdate(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('ADMIN')")
    public void deleteCountry(@PathVariable Long id) {
        countryService.deleteCountry(id);
    }
}
