package com.example.backend.user.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AssignRolesRequest {

    @NotEmpty(message = "At least one role is required")
    private List<String> roles;
}