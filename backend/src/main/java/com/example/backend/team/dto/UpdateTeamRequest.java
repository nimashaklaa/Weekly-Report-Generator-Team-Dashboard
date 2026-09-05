package com.example.backend.team.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateTeamRequest {

    @Size(max = 150, message = "Team name must not exceed 150 characters")
    private String name;

    private String description;

    private Integer managerId;
}