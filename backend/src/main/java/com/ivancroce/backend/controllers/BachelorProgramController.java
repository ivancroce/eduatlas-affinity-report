package com.ivancroce.backend.controllers;

import com.ivancroce.backend.entities.BachelorProgram;
import com.ivancroce.backend.exceptions.ValidationException;
import com.ivancroce.backend.payloads.BachelorRegistrationDTO;
import com.ivancroce.backend.services.BachelorProgramService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bachelor-programs")
public class BachelorProgramController {

    @Autowired
    private BachelorProgramService bachelorProgramService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public Page<BachelorProgram> getAllPrograms(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size,
                                                @RequestParam(defaultValue = "id") String sortBy) {
        return bachelorProgramService.findAllPrograms(page, size, sortBy);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public BachelorProgram getProgramById(@PathVariable Long id) {
        return bachelorProgramService.findById(id);
    }

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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('ADMIN')")
    public void deleteProgram(@PathVariable Long id) {
        bachelorProgramService.deleteProgram(id);
    }


}
