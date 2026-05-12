package com.ivancroce.backend.controllers;

import com.ivancroce.backend.entities.User;
import com.ivancroce.backend.exceptions.ValidationException;
import com.ivancroce.backend.payloads.UserDetailDTO;
import com.ivancroce.backend.payloads.UserRegistrationDTO;
import com.ivancroce.backend.payloads.UserRespDTO;
import com.ivancroce.backend.payloads.UserUpdateDTO;
import com.ivancroce.backend.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Admin user management and authenticated user profile endpoints")
public class UserController {
    private final UserService userService;

    @Operation(summary = "Get all users paginated (Admin)", description = "Retrieves a paginated list of all registered users.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated user list returned"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only")
    })
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public Page<UserDetailDTO> findAllUsers(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "10") int size,
                                   @RequestParam(defaultValue = "id") String sortBy) {
        Page<User> users = userService.findAllUsers(page, size, sortBy);
        return users.map(UserDetailDTO::from);
    }

    @Operation(summary = "Get a user by ID (Admin)", description = "Retrieves a single user's details by their unique identifier.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User found"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public UserDetailDTO findUserById(@PathVariable Long id) {
        User user = userService.findById(id);
        return UserDetailDTO.from(user);
    }

    @Operation(summary = "Get my profile", description = "Returns the profile of the currently authenticated user (Student or Admin).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile returned"),
            @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('STUDENT','ADMIN')")
    public UserDetailDTO getMyProfile(@AuthenticationPrincipal User currentUser) {
        return UserDetailDTO.from(currentUser);
    }

    @Operation(summary = "Create a new user (Admin)", description = "Registers a new user with an assigned role. Admin only.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User created"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only")
    })
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

    @Operation(summary = "Update a user (Admin)", description = "Updates an existing user's details by ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User updated"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
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

    @Operation(summary = "Delete a user (Admin)", description = "Removes a user from the system by ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "User deleted"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void findByIdAndDelete(@PathVariable Long id) {
        userService.findByIdAndDelete(id);
    }

    @Operation(summary = "Search users (Admin)", description = "Filter users by role or name/email keyword.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search results returned"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only")
    })
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('ADMIN')")
    public Page<User> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "firstName") String sort,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search
    ) {
         return userService.searchUsers(role, search, page, size, sort, direction);
    }
}
