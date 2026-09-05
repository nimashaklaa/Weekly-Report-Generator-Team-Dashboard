package com.example.backend.project.dto;

import com.example.backend.project.model.Project;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProjectResponse {

    private Integer id;
    private String name;
    private String description;
    private String colorHex;
    private boolean active;

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .colorHex(project.getColorHex())
                .active(project.isActive())
                .build();
    }
}
