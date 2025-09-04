package com.ivancroce.backend.runners;

import com.ivancroce.backend.services.ExcelImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ExcelImportService excelImportService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting data import...");
        excelImportService.importCountriesFromExcel();
        System.out.println("Data import completed!");
    }
}
