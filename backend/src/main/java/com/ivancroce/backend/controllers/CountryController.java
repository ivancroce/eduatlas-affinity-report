package com.ivancroce.backend.controllers;

import com.ivancroce.backend.entities.Country;
import com.ivancroce.backend.exceptions.ValidationException;
import com.ivancroce.backend.payloads.CountryRegistrationDTO;
import com.ivancroce.backend.services.CountryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/countries")
public class CountryController {

    @Autowired
    private CountryService countryService;

    @GetMapping
    public Page<Country> getAllCountries(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size,
                                        @RequestParam(defaultValue = "id") String sortBy) {
        return countryService.findAllCountries(page, size, sortBy);
    }

    @GetMapping("/{id}")
    public Country getCountryById(@PathVariable Long id) {
        return countryService.findById(id);
    }

    @PostMapping
    public Country createCountry(@Validated @RequestBody CountryRegistrationDTO dto, BindingResult validationResult) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }
        return countryService.save(dto);
    }
}
