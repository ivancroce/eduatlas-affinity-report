package com.ivancroce.backend.services;

import com.ivancroce.backend.entities.User;
import com.ivancroce.backend.enums.Role;
import com.ivancroce.backend.exceptions.BadRequestException;
import com.ivancroce.backend.exceptions.NotFoundException;
import com.ivancroce.backend.payloads.UserRegistrationDTO;
import com.ivancroce.backend.payloads.UserRespDTO;
import com.ivancroce.backend.payloads.UserUpdateDTO;
import com.ivancroce.backend.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Page<User> findAllUsers(int page, int size, String sortBy) {
        if (size > 50) size = 50;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).ascending());
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
        userRepository.findByEmail(userDTO.email()).ifPresent(user -> {
            throw new BadRequestException("The Email " + user.getEmail() + " is already in use!");
        });
        userRepository.findByUsername(userDTO.username()).ifPresent(user -> {
            throw new BadRequestException("The username " + user.getUsername() + " is already in use!");
        });

        String encodedPassword = passwordEncoder.encode(userDTO.password());
        Role userRole = userDTO.role() != null ? userDTO.role() : Role.ADMIN;
        User admin = new User(userDTO.username(), userDTO.email(), encodedPassword,
                userRole, userDTO.firstName(), userDTO.lastName());

        User savedUser = userRepository.save(admin);
        return new UserRespDTO(savedUser.getId());
    }

    public UserRespDTO save(UserRegistrationDTO userDTO) {
        userRepository.findByEmail(userDTO.email()).ifPresent(user -> {
            throw new BadRequestException("The Email " + user.getEmail() + " is already in use!");
        });
        userRepository.findByUsername(userDTO.username()).ifPresent(user -> {
            throw new BadRequestException("The username " + userDTO.username() + " is already in use!");
        });

        String encodedPassword = passwordEncoder.encode(userDTO.password());
        Role userRole = userDTO.role() != null ? userDTO.role() : Role.USER;
        User newUser = new User(userDTO.username(), userDTO.email(), encodedPassword, userRole, userDTO.firstName(), userDTO.lastName());

        User savedUser = userRepository.save(newUser);
        return new UserRespDTO(savedUser.getId());
    }

    public User findByIdAndUpdate(Long id, UserUpdateDTO userDTO) {
        User found = this.findById(id);

        if (userRepository.existsByUsernameAndIdNot(userDTO.username(), id)) {
            throw new BadRequestException("Username '" + userDTO.username() + "' is already in use!");
        }

        found.setUsername(userDTO.username());
        found.setEmail(userDTO.email());
        found.setFirstName(userDTO.firstName());
        found.setLastName(userDTO.lastName());
        found.setRole(userDTO.role());

        if (!found.getEmail().equals(userDTO.email()) &&
                userRepository.existsByEmail(userDTO.email())) {
            throw new BadRequestException("Email '" + userDTO.email() + "' is already in use!");
        }

        if (userDTO.password() != null && !userDTO.password().trim().isEmpty()) {
            found.setPassword(passwordEncoder.encode(userDTO.password()));
        }

        if (userDTO.avatarUrl() != null && !userDTO.avatarUrl().isBlank()) {
            found.setAvatarUrl(userDTO.avatarUrl());
        } else {
            found.setAvatarUrl("https://ui-avatars.com/api/?name=" +
                    userDTO.firstName() + "+" + userDTO.lastName());
        }

        return userRepository.save(found);
    }

    public void findByIdAndDelete(Long id) {
        User found = this.findById(id);
        userRepository.delete(found);
    }

    public Page<User> searchUsers(String role, String search, int page, int size, String sortBy, String direction) {
        if (size > 50) size = 50;
        Specification<User> roleSpec = (root, query, builder) -> {
            if (role == null || role.isEmpty()) {
                return null;
            }
            return builder.equal(root.get("role"), Role.valueOf(role));
        };

        Specification<User> searchSpec = (root, query, builder) -> {
            if (search == null || search.isEmpty()) {
                return null;
            }
            String likePattern = "%" + search.toLowerCase() + "%";
            return builder.or(
                    builder.like(builder.lower(root.get("firstName")), likePattern),
                    builder.like(builder.lower(root.get("lastName")), likePattern),
                    builder.like(builder.lower(root.get("username")), likePattern),
                    builder.like(builder.lower(root.get("email")), likePattern)
            );
        };

        Specification<User> specification = Specification.<User>unrestricted()
                .and(roleSpec)
                .and(searchSpec);

        Sort sort = direction.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> result = userRepository.findAll(specification, pageable);

        return result;
    }
}
