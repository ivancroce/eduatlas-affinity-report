package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.User;
import com.ivancroce.backend.exceptions.UnauthorizedException;
import com.ivancroce.backend.payloads.UserLoginDTO;
import com.ivancroce.backend.tools.JWTTools;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    @Autowired
    private UserService userService;

    @Autowired
    private JWTTools jwtTools;

    @Autowired
    private PasswordEncoder bCrypt;

    public String checkEmailBeforeLogin(UserLoginDTO payload) {
        User found = userService.findByEmail(payload.email());
        if (bCrypt.matches(payload.password(), found.getPassword())) {
            return jwtTools.createToken(found);
        } else {
            throw new UnauthorizedException("Unauthorized - try again");
        }
    }
}
