package com.ivancroce.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "countries")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Country {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;
    @Column(nullable = false, unique = true)
    private String name;
    @Column(nullable = false, name="years_compulsory_schooling")
    private Integer yearsCompulsorySchooling;
    @Column(nullable = false, name="duration_ba")
    private Integer durationBa;
    @Column(nullable = false, name="credits_per_year")
    private Integer creditsPerYear;
    @Column(nullable = false, name="total_credits")
    private Integer totalCredits;
    @Column(nullable = false, name="grading_system")
    private String gradingSystem;
    @Column(nullable = false, name ="eqf_level")
    private Integer eqfLevel;
    @Column(nullable = false, name="official_denomination")
    private String officialDenomination;

    public Country(String name, Integer yearsCompulsorySchooling, Integer durationBa, Integer creditsPerYear, String gradingSystem, Integer eqfLevel, String officialDenomination) {
        this.name = name;
        this.yearsCompulsorySchooling = yearsCompulsorySchooling;
        this.durationBa = durationBa;
        this.creditsPerYear = creditsPerYear;
        this.totalCredits = durationBa * creditsPerYear;
        this.gradingSystem = gradingSystem;
        this.eqfLevel = eqfLevel;
        this.officialDenomination = officialDenomination;
    }
}
