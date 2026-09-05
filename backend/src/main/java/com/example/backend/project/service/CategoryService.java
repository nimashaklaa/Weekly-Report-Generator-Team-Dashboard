package com.example.backend.project.service;

import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.project.dto.CategoryRequest;
import com.example.backend.project.dto.CategoryResponse;
import com.example.backend.project.dto.UpdateCategoryRequest;
import com.example.backend.project.model.Category;
import com.example.backend.project.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalStateException("A category with this name already exists");
        }
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .colorHex(request.getColorHex())
                .isActive(true)
                .build();
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public Page<CategoryResponse> getAllCategories(Boolean activeOnly, Pageable pageable) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return categoryRepository.findAllByIsActive(true, pageable).map(CategoryResponse::from);
        }
        return categoryRepository.findAll(pageable).map(CategoryResponse::from);
    }

    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findByIsActiveTrue().stream()
                .map(CategoryResponse::from)
                .toList();
    }

    public CategoryResponse getCategoryById(Integer id) {
        return categoryRepository.findById(id)
                .map(CategoryResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    @Transactional
    public CategoryResponse updateCategory(Integer id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (request.getName() != null) {
            if (categoryRepository.existsByNameAndIdNot(request.getName(), id)) {
                throw new IllegalStateException("A category with this name already exists");
            }
            category.setName(request.getName());
        }
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getColorHex() != null) category.setColorHex(request.getColorHex());

        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public void deactivateCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        if (!category.isActive()) {
            throw new IllegalStateException("Category is already inactive");
        }
        category.setActive(false);
        categoryRepository.save(category);
    }
}
