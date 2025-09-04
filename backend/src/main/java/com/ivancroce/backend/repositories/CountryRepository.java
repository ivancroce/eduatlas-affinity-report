package com.ivancroce.backend.repositories;

import com.ivancroce.backend.entities.Country;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CountryRepository extends JpaRepository<Country, Long> {
    boolean existsByName(String name);
    Optional<Country> findByName(String name);
}
