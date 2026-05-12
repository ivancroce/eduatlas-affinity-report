package com.ivancroce.backend.repositories;

import com.ivancroce.backend.entities.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface CountryRepository extends JpaRepository<Country, Long>, JpaSpecificationExecutor<Country> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Country> findByCountryCodeIgnoreCase(String countryCode);
}
