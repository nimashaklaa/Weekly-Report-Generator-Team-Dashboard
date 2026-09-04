package com.example.backend.department.controller;

import com.example.backend.department.model.Department;
import com.example.backend.department.model.JobTitle;
import com.example.backend.department.repository.DepartmentRepository;
import com.example.backend.department.repository.JobTitleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;

    @GetMapping
    public ResponseEntity<List<Department>> getAll() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @GetMapping("/job-titles")
    public ResponseEntity<List<JobTitle>> getAllJobTitles() {
        return ResponseEntity.ok(jobTitleRepository.findAll());
    }
}
