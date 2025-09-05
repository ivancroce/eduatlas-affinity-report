package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.User;
import com.ivancroce.backend.enums.Role;
import com.ivancroce.backend.exceptions.NotFoundException;
import com.ivancroce.backend.payloads.UserRegistrationDTO;
import com.ivancroce.backend.payloads.UserRespDTO;
import com.ivancroce.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Page<User> findAllUsers(int page, int size, String sortBy) {
        if (size > 50) size = 50;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        return userRepository.findAll(pageable);
    }

    public User findById(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new NotFoundException(userId));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public User tryFindByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public UserRespDTO saveAdmin(UserRegistrationDTO userDTO) {
        String encodedPassword = passwordEncoder.encode(userDTO.password());
        User admin = new User(userDTO.username(), userDTO.email(), encodedPassword,
                Role.ADMIN, userDTO.firstName(), userDTO.lastName());

        User savedUser = userRepository.save(admin);
        return new UserRespDTO(savedUser.getId());
    }
}
