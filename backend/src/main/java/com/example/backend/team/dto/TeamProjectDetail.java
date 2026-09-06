package com.example.backend.team.dto;

import com.example.backend.user.dto.UserResponse;
import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class TeamProjectDetail {
    private Integer projectId;
    private String projectName;
    private String colorHex;
    private List<UserResponse> allowedMembers;
}
