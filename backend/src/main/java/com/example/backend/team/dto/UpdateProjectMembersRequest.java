package com.example.backend.team.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class UpdateProjectMembersRequest {
    private List<Integer> memberIds;
}
