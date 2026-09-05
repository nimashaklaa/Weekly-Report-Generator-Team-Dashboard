package com.example.backend.project.repository;

import com.example.backend.project.model.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findByIsActiveTrue();

    Page<Category> findAll(Pageable pageable);

    Page<Category> findAllByIsActive(boolean isActive, Pageable pageable);

    Optional<Category> findByName(String name);

    boolean existsByNameAndIdNot(String name, Integer id);
}
