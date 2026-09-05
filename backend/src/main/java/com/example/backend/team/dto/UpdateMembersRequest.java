package com.example.backend.team.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class UpdateMembersRequest {

    @NotNull(message = "Member IDs list is required")
    private List<Integer> memberIds;
}