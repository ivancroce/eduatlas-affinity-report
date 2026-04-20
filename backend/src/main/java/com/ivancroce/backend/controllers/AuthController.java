package com.ivancroce.backend.controllers;

import com.ivancroce.backend.payloads.UserLoginDTO;
import com.ivancroce.backend.payloads.UserLoginRespDTO;
import com.ivancroce.backend.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public UserLoginRespDTO login(@Valid @RequestBody UserLoginDTO loginDTO) {
        String token = authService.checkEmailBeforeLogin(loginDTO);
        return new UserLoginRespDTO(token);
    }
}
