package com.example.backend.team.dto;

import com.example.backend.team.model.Team;
import com.example.backend.user.dto.UserResponse;
import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class TeamResponse {

    private Integer id;
    private String name;
    private String description;
    private UserResponse manager;
    private List<UserResponse> members;
    private boolean active;
    private int memberCount;
    private List<TeamProjectDetail> projects;

    public static TeamResponse from(Team team) {
        return from(team, List.of());
    }

    public static TeamResponse from(Team team, List<TeamProjectDetail> projects) {
        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .manager(UserResponse.from(team.getManager()))
                .members(team.getMembers() != null
                        ? team.getMembers().stream().map(UserResponse::from).toList()
                        : List.of())
                .active(team.isActive())
                .memberCount(team.getMembers() != null ? team.getMembers().size() : 0)
                .projects(projects)
                .build();
    }
}
