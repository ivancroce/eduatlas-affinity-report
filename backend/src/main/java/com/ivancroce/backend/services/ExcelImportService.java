package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.BachelorProgram;
import com.ivancroce.backend.entities.Country;
import com.ivancroce.backend.repositories.BachelorProgramRepository;
import com.ivancroce.backend.repositories.CountryRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ExcelImportService {
    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private BachelorProgramRepository bachelorProgramRepository;


    public void importCountriesFromExcel() throws Exception {
        ClassPathResource resource = new ClassPathResource("data/matrix.xlsx");

        try(Workbook workbook = new XSSFWorkbook(resource.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 2; i <= 32; i++) {
                Row row = sheet.getRow(i);
                if(row != null) {
                    Country country = parseRowToCountry(row);
                    if (country != null) {
                        Country savedCountry = countryRepository.save(country);
                        createBachelorPrograms(savedCountry, row);
                        System.out.println("Saved: " + country.getName());
                }
            }
        }
    }}

    private Country parseRowToCountry(Row row) {
        try {
            // Column A = Country name
            String name = getCellValueAsString(row.getCell(0));
            if (name == null || name.isEmpty()) return null;

            // Skip if already exists
            if (countryRepository.existsByNameIgnoreCase(name)) {
                System.out.println("Country " + name + " already exists, skipping");
                return null;
            }
            // Parse all fields from Excel
            Integer yearsSchooling = parseIntegerWithAsterisk(getCellValueAsString(row.getCell(1))); // "13*" -> 13
            String gradingSystem = parseGradingSystem(row);
            String creditRatio = getCellValueAsString(row.getCell(23));
            String countryCode = getCellValueAsString(row.getCell(24));

            if (name != null && yearsSchooling != null) {
                return new Country(name, yearsSchooling,
                        gradingSystem, creditRatio, countryCode);
            }

            if (creditRatio == null || creditRatio.trim().isEmpty()) {
                creditRatio = "25/30 HOURS OF STUDENT WORK";
            }
        } catch (Exception e) {
            System.err.println("Error parsing row " + (row.getRowNum() + 1) + ": " + e.getMessage());
        }
        return null;
    }

    private Integer parseIntegerWithAsterisk(String value) {
        if (value == null || value.trim().isEmpty()) return null;

        // Handle cases like "12|13*"
        if (value.contains("|")) {
            String[] parts = value.split("\\|");
            // Take the second part (usually higher): "12|13*" -> "13*"
            value = parts[parts.length - 1].trim();
        }

        // Remove asterisks: "13*" -> "13"
        String clean = value.replaceAll("\\*", "").trim();

        try {
            if (clean.contains(".")) {
                return (int) Math.ceil(Double.parseDouble(clean));
            }
            return Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            System.err.println("Could not parse: " + value);
            return null;
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((int) cell.getNumericCellValue());
            case BLANK:
                return null;
            default:
                return cell.toString().trim();
        }
    }

    private Integer parseEqfLevel(Row row) {
        Integer eqf = parseIntegerWithAsterisk(getCellValueAsString(row.getCell(17)));
        return eqf != null ? eqf : 6; // Default fallback
    }

    private String parseOfficialDenomination(Row row) {
        return getCellValueAsString(row.getCell(18));
    }


    private String extractGradeFromCell(String cellValue, boolean extractHigher) {
        if (cellValue == null || cellValue.trim().isEmpty()) return null;

        // Handle values with "|" separator first (like "1|3")
        if (cellValue.contains("|")) {
            String[] parts = cellValue.split("\\|");
            // For extractHigher=false (column Q), take first part
            // For extractHigher=true (column M), take last part
            String selectedPart = extractHigher ? parts[parts.length - 1].trim() : parts[0].trim();
            return extractGradeFromCell(selectedPart, extractHigher); // Recursive call with selected part
        }

        // Handle letter grades
        if (cellValue.matches(".*[A-Z]+.*")) {
            Pattern pattern = Pattern.compile("([A-Z]+)");
            Matcher matcher = pattern.matcher(cellValue);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        // Handle numeric values
        if (cellValue.matches(".*\\d+.*")) {
            List<Double> numbers = new ArrayList<>();
            Pattern pattern = Pattern.compile("(\\d+(?:\\.\\d+)?)");
            Matcher matcher = pattern.matcher(cellValue);

            while (matcher.find()) {
                numbers.add(Double.parseDouble(matcher.group(1)));
            }

            if (!numbers.isEmpty()) {
                Double result;

                if (numbers.size() == 1) {
                    result = numbers.getFirst();
                } else {
                    double firstNum = numbers.getFirst();

                    // German grading system (higher-lower like 6-1)
                    if (firstNum <= 6 && firstNum >= 1) {
                                result = extractHigher ?
                                numbers.stream().min(Double::compare).orElse(firstNum) :
                                numbers.stream().max(Double::compare).orElse(firstNum);
                    }
                    // Italian grading system (lower-higher like 18-30)
                    else {
                        result = extractHigher ?
                                numbers.stream().max(Double::compare).orElse(firstNum) :
                                numbers.stream().min(Double::compare).orElse(firstNum);
                    }
                }
                return String.valueOf(result.intValue());
            }
        }

        return null;
    }

    private String parseGradingSystem(Row row) {
        // Get values from specific columns
        String columnM = getCellValueAsString(row.getCell(12)); // Column M - higher grades
        String columnQ = getCellValueAsString(row.getCell(16)); // Column Q - lower grades

        // Extract grades
        String higherGrade = extractGradeFromCell(columnM, true);  // true = extract higher/better grade
        String lowerGrade = extractGradeFromCell(columnQ, false);  // false = extract lower/worse grade

        if (lowerGrade != null && higherGrade != null) {
            return lowerGrade + "-" + higherGrade;
        }

        return "N/A";
    }

    private void createBachelorPrograms(Country country, Row row) {
        for (int duration = 1; duration <= 5; duration++) {
            int durationCol = duration + 1; // C=2, D=3, E=4, F=5, G=6
            int creditsCol = duration + 6;  // H=7, I=8, J=9, K=10, L=11

            String durationValue = getCellValueAsString(row.getCell(durationCol));

            if (durationValue != null && !durationValue.trim().isEmpty()) {
                boolean isSpecial = durationValue.contains("*");
                Integer creditsPerYear = parseIntegerWithAsterisk(getCellValueAsString(row.getCell(creditsCol)));
                String officialDenomination = parseOfficialDenomination(row);
                Integer eqfLevel = parseEqfLevel(row);

                if (creditsPerYear == null) creditsPerYear = 60; // Default fallback

                if ("Poland".equalsIgnoreCase(country.getName()) &&
                        "3.5*".equals(durationValue) && duration == 4) {
                    creditsPerYear = 60;
                }

                BachelorProgram program = new BachelorProgram(
                        duration,
                        isSpecial,
                        creditsPerYear,
                        eqfLevel,
                        officialDenomination,
                        country
                );

                if ("Poland".equalsIgnoreCase(country.getName()) &&
                        "3.5*".equals(durationValue) && duration == 4) {
                    program.setTotalCredits(210);
                }

                bachelorProgramRepository.save(program);
                System.out.println("  - Created program: " + duration + " years, " + creditsPerYear + " credits");
            }
        }
    }
}

