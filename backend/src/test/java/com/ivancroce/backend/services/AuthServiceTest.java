package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.User;
import com.ivancroce.backend.enums.Role;
import com.ivancroce.backend.exceptions.NotFoundException;
import com.ivancroce.backend.exceptions.UnauthorizedException;
import com.ivancroce.backend.payloads.UserLoginDTO;
import com.ivancroce.backend.tools.JWTTools;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private JWTTools jwtTools;

    @Mock
    private PasswordEncoder bCrypt;

    @InjectMocks
    private AuthService authService;

    @Test
    void validCredentials_returnsToken() {
        User user = new User("mario", "mario@example.com", "hashed-pw", Role.USER, "Mario", "Rossi");
        UserLoginDTO payload = new UserLoginDTO("mario@example.com", "plain-pw");
        when(userService.findByEmail("mario@example.com")).thenReturn(user);
        when(bCrypt.matches("plain-pw", "hashed-pw")).thenReturn(true);
        when(jwtTools.createToken(user)).thenReturn("jwt-token");

        String result = authService.checkEmailBeforeLogin(payload);

        assertThat(result).isEqualTo("jwt-token");
    }

    @Test
    void wrongPassword_throwsUnauthorizedException() {
        User user = new User("mario", "mario@example.com", "hashed-pw", Role.USER, "Mario", "Rossi");
        UserLoginDTO payload = new UserLoginDTO("mario@example.com", "wrong-pw");
        when(userService.findByEmail("mario@example.com")).thenReturn(user);
        when(bCrypt.matches("wrong-pw", "hashed-pw")).thenReturn(false);

        assertThatThrownBy(() -> authService.checkEmailBeforeLogin(payload))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void unknownEmail_throwsUnauthorizedException() {
        UserLoginDTO payload = new UserLoginDTO("unknown@example.com", "any-pw");
        when(userService.findByEmail("unknown@example.com"))
                .thenThrow(new NotFoundException("User not found"));

        assertThatThrownBy(() -> authService.checkEmailBeforeLogin(payload))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void userEnumeration_wrongPasswordAndUnknownEmail_throwSameMessage() {
        User user = new User("mario", "mario@example.com", "hashed-pw", Role.USER, "Mario", "Rossi");

        when(userService.findByEmail("mario@example.com")).thenReturn(user);
        when(bCrypt.matches("wrong-pw", "hashed-pw")).thenReturn(false);
        UnauthorizedException wrongPasswordEx = catchThrowableOfType(
                () -> authService.checkEmailBeforeLogin(new UserLoginDTO("mario@example.com", "wrong-pw")),
                UnauthorizedException.class
        );

        when(userService.findByEmail("ghost@example.com"))
                .thenThrow(new NotFoundException("User not found"));
        UnauthorizedException unknownEmailEx = catchThrowableOfType(
                () -> authService.checkEmailBeforeLogin(new UserLoginDTO("ghost@example.com", "any-pw")),
                UnauthorizedException.class
        );

        assertThat(wrongPasswordEx.getMessage()).isEqualTo("Invalid email or password");
        assertThat(unknownEmailEx.getMessage()).isEqualTo("Invalid email or password");
        assertThat(wrongPasswordEx.getMessage()).isEqualTo(unknownEmailEx.getMessage());
    }
}
