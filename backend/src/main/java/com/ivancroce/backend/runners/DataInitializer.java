package com.ivancroce.backend.runners;

import com.ivancroce.backend.entities.User;

import com.ivancroce.backend.enums.Role;
import com.ivancroce.backend.payloads.UserRegistrationDTO;
import com.ivancroce.backend.payloads.UserRespDTO;

import com.ivancroce.backend.services.ExcelImportService;
import com.ivancroce.backend.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ExcelImportService excelImportService;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin.username}")
    private String adminUsername;
    @Value("${admin.email}")
    private String adminEmail;
    @Value("${admin.password}")
    private String adminPassword;
    @Value("${admin.first-name}")
    private String adminFirstName;
    @Value("${admin.last-name}")
    private String adminLastName;

    @Override
    public void run(String... args) throws Exception {
        log.info("=== Starting data import... ===");
        excelImportService.importCountriesFromExcel();
        log.info("=== Data import completed! ===");

        log.info("=== Checking admin user... ===");
        User existingAdmin = userService.tryFindByEmail(adminEmail);
        if (existingAdmin == null) {
            UserRegistrationDTO adminDTO = new UserRegistrationDTO(
                    adminUsername, adminEmail, adminPassword, adminFirstName, adminLastName, Role.ADMIN
            );
            UserRespDTO createdAdmin = userService.saveAdmin(adminDTO);
            log.info("=== Admin user created: {} (ID: {}) ===", adminUsername, createdAdmin.userId());
        } else {
            log.info("=== Admin user already exists ===");
        }
    }
}
