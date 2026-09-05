package com.example.backend.project.dto;

import com.example.backend.project.model.Category;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoryResponse {

    private Integer id;
    private String name;
    private String description;
    private String colorHex;
    private boolean active;

    public static CategoryResponse from(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .colorHex(category.getColorHex())
                .active(category.isActive())
                .build();
    }
}
