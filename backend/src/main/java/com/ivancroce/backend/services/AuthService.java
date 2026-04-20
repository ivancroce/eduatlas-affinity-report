package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.User;
import com.ivancroce.backend.exceptions.NotFoundException;
import com.ivancroce.backend.exceptions.UnauthorizedException;
import com.ivancroce.backend.payloads.UserLoginDTO;
import com.ivancroce.backend.tools.JWTTools;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserService userService;
    private final JWTTools jwtTools;
    private final PasswordEncoder bCrypt;

    public String checkEmailBeforeLogin(UserLoginDTO payload) {
        try {
            User found = userService.findByEmail(payload.email());
            if (bCrypt.matches(payload.password(), found.getPassword())) {
                return jwtTools.createToken(found);
            }
        } catch (NotFoundException ignored) {
            // fall through — same response whether email is unknown or password is wrong
        }
        throw new UnauthorizedException("Invalid email or password");
    }
}
