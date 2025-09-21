package com.ivancroce.backend.runners;

import com.ivancroce.backend.entities.User;

import com.ivancroce.backend.enums.Role;
import com.ivancroce.backend.payloads.UserRegistrationDTO;
import com.ivancroce.backend.payloads.UserRespDTO;

import com.ivancroce.backend.services.ExcelImportService;
import com.ivancroce.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
        System.out.println("=== Starting data import... ===");
        excelImportService.importCountriesFromExcel();
        System.out.println("=== Data import completed! ===");

        System.out.println("=== Checking admin user... ===");
        User existingAdmin = userService.tryFindByEmail(adminEmail);
        if (existingAdmin == null) {
            UserRegistrationDTO adminDTO = new UserRegistrationDTO(
                    adminUsername, adminEmail, adminPassword, adminFirstName, adminLastName, Role.ADMIN
            );
            UserRespDTO createdAdmin = userService.saveAdmin(adminDTO);
            System.out.println("=== Admin user created: " + adminUsername + " (ID: " + createdAdmin.userId() + ") ===");
        } else {
            System.out.println("=== Admin user already exists ===");
        }
    }
}
