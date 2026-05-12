package com.ivancroce.backend.controllers;

import com.ivancroce.backend.payloads.UserLoginDTO;
import com.ivancroce.backend.payloads.UserLoginRespDTO;
import com.ivancroce.backend.services.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login endpoint — returns a JWT token on success")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Login", description = "Authenticates a user by email and password and returns a signed JWT token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Login successful — JWT returned"),
            @ApiResponse(responseCode = "400", description = "Validation error on request body"),
            @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    @SecurityRequirements({})
    @PostMapping("/login")
    public UserLoginRespDTO login(@Valid @RequestBody UserLoginDTO loginDTO) {
        String token = authService.checkEmailBeforeLogin(loginDTO);
        return new UserLoginRespDTO(token);
    }
}
