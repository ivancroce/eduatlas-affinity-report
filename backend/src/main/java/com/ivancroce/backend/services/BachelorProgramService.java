package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.BachelorProgram;
import com.ivancroce.backend.entities.Country;
import com.ivancroce.backend.exceptions.BadRequestException;
import com.ivancroce.backend.exceptions.NotFoundException;
import com.ivancroce.backend.payloads.BachelorRegistrationDTO;
import com.ivancroce.backend.repositories.BachelorProgramRepository;
import com.ivancroce.backend.repositories.CountryRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
public class BachelorProgramService {
@Autowired
    private BachelorProgramRepository bachelorProgramRepository;
@Autowired
    private CountryRepository countryRepository;

public BachelorProgram findById(Long id) {
    return bachelorProgramRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Bachelor program not found with id: " + id));
}

    public Page<BachelorProgram> findAllPrograms(int page, int size, String sortBy) {
        if (size > 50) size = 50;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
        return bachelorProgramRepository.findAll(pageable);
    }

    public List<BachelorProgram> findByCountryId(Long countryId) {
        return bachelorProgramRepository.findByCountryId(countryId);
    }

    public BachelorProgram getRepresentativeProgramForCountry(Long countryId) {
        // Try the "standard" program first (16 years)
        Optional<BachelorProgram> standardProgram = bachelorProgramRepository
                .findStandardProgramForCountry(countryId);

        if (standardProgram.isPresent()) {
            return standardProgram.get();
        }

        // Fallback
        return bachelorProgramRepository.findLongestProgramForCountry(countryId)
                .orElseThrow(() -> new NotFoundException("No programs found for country " + countryId));
    }

    private BachelorProgram mapToEntity(BachelorRegistrationDTO dto, Country country) {
        return new BachelorProgram(
                dto.duration(),
                dto.isSpecialProgram() != null ? dto.isSpecialProgram() : false,
                dto.creditsPerYear(),
                dto.eqfLevel(),
                dto.officialDenomination(),
                country
        );
    }

    public BachelorProgram save(BachelorRegistrationDTO dto) {
    Country country = countryRepository.findById(dto.countryId())
                .orElseThrow(() -> new NotFoundException("Country not found with id: " + dto.countryId()));
        // Check that there is not already a program with the same duration for this country
        if (bachelorProgramRepository.existsByCountryIdAndDuration(dto.countryId(), dto.duration())) {
            throw new BadRequestException("Program with duration " + dto.duration() +
                    " years already exists for country " + country.getName());
        }

        BachelorProgram program = mapToEntity(dto, country);
        return bachelorProgramRepository.save(program);
    }

    private void updateProgramFromDto(BachelorProgram program, BachelorRegistrationDTO dto, Country country) {
        program.setDuration(dto.duration());
        program.setIsSpecialProgram(dto.isSpecialProgram() != null ? dto.isSpecialProgram() : false);
        program.setCreditsPerYear(dto.creditsPerYear());
        program.setTotalCredits(dto.duration() * dto.creditsPerYear());
        program.setEqfLevel(dto.eqfLevel());
        program.setOfficialDenomination(dto.officialDenomination());
        program.setCountry(country);
    }

    public BachelorProgram findByIdAndUpdate(Long id, BachelorRegistrationDTO dto) {
        BachelorProgram existingProgram = findById(id);

        // If the duration changes, check that it does not already exist
        if (!existingProgram.getDuration().equals(dto.duration()) &&
                bachelorProgramRepository.existsByCountryIdAndDuration(dto.countryId(), dto.duration())) {
            throw new BadRequestException("Program with duration " + dto.duration() +
                    " years already exists for this country");
        }

        Country country = countryRepository.findById(dto.countryId())
                .orElseThrow(() -> new NotFoundException("Country not found with id: " + dto.countryId()));

        updateProgramFromDto(existingProgram, dto, country);
        return bachelorProgramRepository.save(existingProgram);
    }

    public void deleteProgram(Long id) {
        BachelorProgram program = findById(id);
        bachelorProgramRepository.delete(program);
    }

    public Page<BachelorProgram> searchBachelorPrograms(Long countryId, Integer duration, Boolean isSpecialProgram,
                                                        int page, int size, String sortBy, String direction) {

        Specification<BachelorProgram> countrySpec = (root, query, builder) ->
                countryId == null ? null : builder.equal(root.get("country").get("id"), countryId);

        Specification<BachelorProgram> durationSpec = (root, query, builder) ->
                duration == null ? null : builder.equal(root.get("duration"), duration);

        Specification<BachelorProgram> specialProgramSpec = (root, query, builder) ->
                isSpecialProgram == null ? null : builder.equal(root.get("isSpecialProgram"), isSpecialProgram);

        Specification<BachelorProgram> specification = Specification.<BachelorProgram>unrestricted()
                .and(countrySpec)
                .and(durationSpec)
                .and(specialProgramSpec);

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return bachelorProgramRepository.findAll(specification, pageable);
    }
}
