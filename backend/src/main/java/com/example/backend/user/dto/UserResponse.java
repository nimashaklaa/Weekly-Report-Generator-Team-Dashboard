package com.example.backend.user.dto;

import com.example.backend.role.Role;
import com.example.backend.user.User;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class UserResponse {
    private Integer id;
    private String firstName;
    private String lastName;
    private String email;
    private String avatarUrl;
    private List<String> roles;
    private String department;
    private String jobTitle;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles().stream().map(Role::getName).toList())
                .department(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .jobTitle(user.getJobTitle() != null ? user.getJobTitle().getTitle() : null)
                .build();
    }
}
