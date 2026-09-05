package com.example.backend.team.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class CreateTeamRequest {

    @NotBlank(message = "Team name is required")
    @Size(max = 150, message = "Team name must not exceed 150 characters")
    private String name;

    private String description;

    @NotNull(message = "Manager ID is required")
    private Integer managerId;

    private List<Integer> memberIds;
}