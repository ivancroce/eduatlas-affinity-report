package com.ivancroce.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="bachelor_programs")
@Getter
@Setter
@ToString(exclude = "country")
@NoArgsConstructor
public class BachelorProgram {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;
    @Column(nullable = false)
    private Integer duration;
    @Column(nullable = false, name = "is_special_program")
    private Boolean isSpecialProgram;
    @Column(nullable = false, name = "credits_per_year")
    private Integer creditsPerYear;
    @Column(nullable = false, name = "total_credits")
    private Integer totalCredits;
    @Column(nullable = false, name = "eqf_level")
    private Integer eqfLevel;
    @Column(nullable = false, name = "official_denomination")
    private String officialDenomination;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id", nullable = false)
    @JsonIgnore
    private Country country;

    public BachelorProgram(Integer duration, Boolean isSpecialProgram, Integer creditsPerYear, Integer eqfLevel,
                           String officialDenomination, Country country) {
        this.duration = duration;
        this.isSpecialProgram = isSpecialProgram != null ? isSpecialProgram : false;
        this.creditsPerYear = creditsPerYear;
        this.totalCredits = duration * creditsPerYear;
        this.eqfLevel = eqfLevel;
        this.officialDenomination = officialDenomination;
        this.country = country;
    }
}
