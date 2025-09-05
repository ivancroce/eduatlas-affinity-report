package com.ivancroce.backend.repositories;

import com.ivancroce.backend.entities.Country;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CountryRepository extends JpaRepository<Country, Long> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Country> findByNameIgnoreCase(String name);
}
