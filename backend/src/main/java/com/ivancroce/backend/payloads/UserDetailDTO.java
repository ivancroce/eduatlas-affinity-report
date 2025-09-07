package com.ivancroce.backend.payloads;

import com.ivancroce.backend.entities.User;

public record UserDetailDTO(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        String avatarUrl,
        String role
) {
    public static UserDetailDTO from(User user) {
        return new UserDetailDTO(
                user.getId(),
                user.getUsernameField(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getAvatarUrl(),
                user.getRole().name()
        );
    }
}
