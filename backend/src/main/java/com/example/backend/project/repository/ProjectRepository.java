package com.example.backend.project.repository;

import com.example.backend.project.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Integer> {

    List<Project> findByIsActiveTrue();

    long countByIsActiveTrue();

    Page<Project> findAll(Pageable pageable);

    Page<Project> findAllByIsActive(boolean isActive, Pageable pageable);

    Optional<Project> findByName(String name);

    boolean existsByNameAndIdNot(String name, Integer id);
}
