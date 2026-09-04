package com.example.backend.department.repository;

import com.example.backend.department.model.JobTitle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JobTitleRepository extends JpaRepository<JobTitle, Integer> {
    Optional<JobTitle> findByTitle(String title);
}
