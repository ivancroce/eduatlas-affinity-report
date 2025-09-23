package com.ivancroce.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "countries")
@Getter
@Setter
@ToString(exclude = "bachelorPrograms")
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
    @Column(nullable = false, name="grading_system")
    private String gradingSystem;
    @Column(name="credit_ratio")
    private String creditRatio;
    @Column(name = "country_code", length = 2)
    private String countryCode;
    @OneToMany(mappedBy = "country", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BachelorProgram> bachelorPrograms = new ArrayList<>();

    public Country(String name, Integer yearsCompulsorySchooling, String gradingSystem, String creditRatio, String countryCode) {
        this.name = name;
        this.yearsCompulsorySchooling = yearsCompulsorySchooling;
        this.gradingSystem = gradingSystem;
        this.creditRatio = creditRatio;
        this.countryCode = countryCode;
    }
}
