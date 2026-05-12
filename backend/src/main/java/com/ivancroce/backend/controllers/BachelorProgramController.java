package com.ivancroce.backend.controllers;

import com.ivancroce.backend.entities.BachelorProgram;
import com.ivancroce.backend.exceptions.ValidationException;
import com.ivancroce.backend.payloads.BachelorRegistrationDTO;
import com.ivancroce.backend.services.BachelorProgramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bachelor-programs")
@RequiredArgsConstructor
@Tag(name = "Bachelor Programs", description = "Admin endpoints for managing bachelor degree programs")
public class BachelorProgramController {

    private final BachelorProgramService bachelorProgramService;

    @Operation(summary = "Get all programs paginated (Admin)", description = "Retrieves a paginated list of all bachelor programs.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated program list returned"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only")
    })
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public Page<BachelorProgram> getAllPrograms(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size,
                                                @RequestParam(defaultValue = "id") String sortBy) {
        return bachelorProgramService.findAllPrograms(page, size, sortBy);
    }

    @Operation(summary = "Get a program by ID (Admin)", description = "Retrieves a single bachelor program by its unique identifier.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Program found"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only"),
            @ApiResponse(responseCode = "404", description = "Program not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public BachelorProgram getProgramById(@PathVariable Long id) {
        return bachelorProgramService.findById(id);
    }

    @Operation(summary = "Create a new program (Admin)", description = "Adds a new bachelor program linked to an existing country.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Program created"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only")
    })
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('ADMIN')")
    public BachelorProgram createProgram(@Validated @RequestBody BachelorRegistrationDTO dto, BindingResult validationResult) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }
        return bachelorProgramService.save(dto);
    }

    @Operation(summary = "Update a program (Admin)", description = "Updates an existing bachelor program by ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Program updated"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only"),
            @ApiResponse(responseCode = "404", description = "Program not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public BachelorProgram updateProgram(@PathVariable Long id, @Validated @RequestBody BachelorRegistrationDTO dto, BindingResult validationResult) {
        if (validationResult.hasErrors()) {
            List<String> errors = validationResult.getFieldErrors().stream()
                    .map(fieldError -> fieldError.getDefaultMessage())
                    .toList();
            throw new ValidationException(errors);
        }
        return bachelorProgramService.findByIdAndUpdate(id, dto);
    }

    @Operation(summary = "Delete a program (Admin)", description = "Removes a bachelor program from the system.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Program deleted"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only"),
            @ApiResponse(responseCode = "404", description = "Program not found")
    })
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('ADMIN')")
    public void deleteProgram(@PathVariable Long id) {
        bachelorProgramService.deleteProgram(id);
    }

    @Operation(summary = "Search programs (Admin)", description = "Filter bachelor programs by country, duration, or special-program flag.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search results returned"),
            @ApiResponse(responseCode = "403", description = "Access denied — Admin only")
    })
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('ADMIN')")
    public Page<BachelorProgram> searchBachelorPrograms(
            @RequestParam(required = false) Long countryId,
            @RequestParam(required = false) Integer duration,
            @RequestParam(required = false) Boolean isSpecialProgram,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        return bachelorProgramService.searchBachelorPrograms(countryId, duration, isSpecialProgram, page, size, sortBy, direction);
    }
}
