package com.ivancroce.backend.controllers;

import com.ivancroce.backend.entities.User;
import com.ivancroce.backend.exceptions.ValidationException;
import com.ivancroce.backend.payloads.UserRegistrationDTO;
import com.ivancroce.backend.payloads.UserRespDTO;
import com.ivancroce.backend.payloads.UserUpdateDTO;
import com.ivancroce.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public Page<User> findAllUsers(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "10") int size,
                                   @RequestParam(defaultValue = "id") String sortBy) {
        return userService.findAllUsers(page, size, sortBy);
    }

    @GetMapping("/{id}")
    public User findUserById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('STUDENT','ADMIN')")
    public User getMyProfile(@AuthenticationPrincipal User currentUser) {
        return currentUser;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public UserRespDTO createNewUser(@RequestBody @Validated UserRegistrationDTO dto, BindingResult validationResult) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getAllErrors().stream()
                    .map(objectError -> objectError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }
        return userService.save(dto);

    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public User findByIdAndUpdate(@PathVariable Long id, @RequestBody @Validated UserUpdateDTO dto, BindingResult validationResult) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getAllErrors().stream()
                    .map(objectError -> objectError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }
        return userService.findByIdAndUpdate(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void findByIdAndDelete(@PathVariable Long id) {
        userService.findByIdAndDelete(id);
    }
}
