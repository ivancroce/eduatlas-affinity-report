package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.Country;

import com.ivancroce.backend.exceptions.BadRequestException;
import com.ivancroce.backend.exceptions.NotFoundException;
import com.ivancroce.backend.payloads.CountryRegistrationDTO;
import com.ivancroce.backend.payloads.CountryRespDTO;
import com.ivancroce.backend.repositories.CountryRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CountryService {

    @Autowired
    private CountryRepository countryRepository;

    public Country findById(Long id) {
        return countryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Country not found with id: " + id));
    }

    public Page<Country> findAllCountries(int page, int size, String sortBy) {
        if (size > 50) size = 50;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return countryRepository.findAll(pageable);
    }

    public Page<Country> searchCountries(Long id, Integer yearsCompulsorySchooling,
                                         int page, int size, String sortBy, String direction) {

        Specification<Country> countrySpec = (root, query, builder) ->
                id == null ? null : builder.equal(root.get("id"), id);

        Specification<Country> yearsSpec = (root, query, builder) ->
                yearsCompulsorySchooling == null ?
                        null :
                        builder.equal(root.get("yearsCompulsorySchooling"), yearsCompulsorySchooling);

        Specification<Country> specification = Specification.<Country>unrestricted()
                .and(countrySpec)
                .and(yearsSpec);

        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return countryRepository.findAll(specification, pageable);
    }

    private Country mapToEntity(CountryRegistrationDTO dto) {
        return new Country(
                dto.name(),
                dto.yearsCompulsorySchooling(),
                dto.gradingSystem(),
                dto.creditRatio()
        );
    }

    public Country save(CountryRegistrationDTO dto) {
        if (countryRepository.existsByNameIgnoreCase(dto.name())) {
            throw new BadRequestException("Country with name '" + dto.name() + "' already exists");
        }

        Country country = mapToEntity(dto);

        return countryRepository.save(country);
    }

    private void updateCountryFromDto(Country country, CountryRegistrationDTO dto) {
        country.setName(dto.name());
        country.setYearsCompulsorySchooling(dto.yearsCompulsorySchooling());
        country.setGradingSystem(dto.gradingSystem());
        country.setCreditRatio(dto.creditRatio());
    }

    public Country findCountryByIdAndUpdate(Long id, CountryRegistrationDTO dto) {
        Country existingCountry = findById(id);

        if (!existingCountry.getName().equalsIgnoreCase(dto.name()) &&
                countryRepository.existsByNameIgnoreCase(dto.name())) {
            throw new BadRequestException("Country with name '" + dto.name() + "' already exists");
        }

        updateCountryFromDto(existingCountry, dto);

        return countryRepository.save(existingCountry);
    }

    public void deleteCountry(Long id) {
        Country country = findById(id);
        countryRepository.delete(country);
    }

    public List<CountryRespDTO> findAllCountriesSimple() {

        List<Country> countries = countryRepository.findAll(Sort.by("name"));

        return countries.stream()
                .map(country -> new CountryRespDTO(country.getId(), country.getName()))
                .toList();
}}
