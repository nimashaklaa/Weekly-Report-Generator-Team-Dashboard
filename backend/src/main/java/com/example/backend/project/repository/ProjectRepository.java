package com.example.backend.project.repository;

import com.example.backend.project.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Integer> {
    List<Project> findByIsActiveTrue();
}