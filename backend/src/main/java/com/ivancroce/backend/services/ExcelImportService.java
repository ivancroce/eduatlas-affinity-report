package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.Country;
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


    public void importCountriesFromExcel() throws Exception {
        ClassPathResource resource = new ClassPathResource("data/matrix.xlsx");

        try(Workbook workbook = new XSSFWorkbook(resource.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 2; i <= 32; i++) {
                Row row = sheet.getRow(i);
                if(row != null) {
                    Country country = parseRowToCountry(row);
                    if (country != null) {
                        countryRepository.save(country);
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
            Integer duration = findDurationValue(row, yearsSchooling);
            Integer creditsPerYear = parseCreditsPerYear(row);
            String gradingSystem = parseGradingSystem(row);
            Integer eqfLevel = parseEqfLevel(row);
            String officialDenomination = parseOfficialDenomination(row);

            if (name != null && yearsSchooling != null && duration != null) {
                return new Country(name, yearsSchooling, duration, creditsPerYear,
                        gradingSystem, eqfLevel, officialDenomination);
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

    private Integer findDurationValue(Row row, Integer yearsSchooling) {
        if (yearsSchooling == null) return null;

        // Calculate target duration for 16-year total
        int targetDuration = 16 - yearsSchooling;

        // Check columns C-G for target value (indices 2-6)
        for (int col = 2; col <= 6; col++) {
            Integer cellValue = parseIntegerWithAsterisk(getCellValueAsString(row.getCell(col)));
            if (cellValue != null && cellValue == targetDuration) {
                return cellValue;
            }
        }
        // If no exact match found, but we know it should be targetDuration for 16-year rule
        System.out.println("Warning: " + " expected duration " + targetDuration + " not found, using calculated value");
        return targetDuration;  // Force the correct duration
    }

    private Integer parseCreditsPerYear(Row row) {
        // Check columns H-L for credits (indices 7-11)
        for (int col = 7; col <= 11; col++) {
            Integer value = parseIntegerWithAsterisk(getCellValueAsString(row.getCell(col)));
            if (value != null) {
                return value;
            }
        }
        return 60; // Default fallback
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
                double firstNum = numbers.getFirst();

                // German/Czech system: lower numbers are better
                if (firstNum <= 6 && firstNum >= 1) {
                    result = extractHigher ? numbers.getFirst() : numbers.getLast();
                }
                // Italian/Spanish system: higher numbers are better
                else {
                    result = extractHigher ? numbers.getLast() : numbers.getFirst();
                }
                // Check if number is whole (no decimals) to clean up display
                return result % 1 == 0 ? String.valueOf(result.intValue()) : String.valueOf(result);
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
}

