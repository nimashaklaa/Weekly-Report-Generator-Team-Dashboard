package com.example.backend.project.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateCategoryRequest {

    @Size(max = 150, message = "Category name must not exceed 150 characters")
    private String name;

    private String description;

    @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "Color must be a valid hex code (e.g. #FF5733)")
    private String colorHex;
}
