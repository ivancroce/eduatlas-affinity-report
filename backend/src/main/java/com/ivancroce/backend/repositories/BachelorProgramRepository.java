package com.ivancroce.backend.repositories;

import com.ivancroce.backend.entities.BachelorProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BachelorProgramRepository extends JpaRepository<BachelorProgram, Long>, JpaSpecificationExecutor<BachelorProgram> {
    List<BachelorProgram> findByCountryId(Long countryId);

    @Query("SELECT bp FROM BachelorProgram bp WHERE bp.country.id = :countryId AND bp.duration = (16 - bp.country.yearsCompulsorySchooling) AND bp.isSpecialProgram = false")
    Optional<BachelorProgram> findStandardProgramForCountry(@Param("countryId") Long countryId);

    @Query("SELECT bp FROM BachelorProgram bp WHERE bp.country.id = :countryId ORDER BY bp.duration DESC LIMIT 1")
    Optional<BachelorProgram> findLongestProgramForCountry(@Param("countryId") Long countryId);

    boolean existsByCountryIdAndDuration(Long countryId, Integer duration);

    boolean existsByCountryIdAndIsSpecialProgramTrue(Long countryId);
}
