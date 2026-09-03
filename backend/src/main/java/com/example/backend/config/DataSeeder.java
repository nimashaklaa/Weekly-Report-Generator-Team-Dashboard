package com.example.backend.config;

import com.example.backend.department.Department;
import com.example.backend.department.DepartmentRepository;
import com.example.backend.department.JobLevel;
import com.example.backend.department.JobTitle;
import com.example.backend.department.JobTitleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Order(2)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;

    @Override
    public void run(String... args) {
        seedDepartments();
        seedJobTitles();
    }

    private void seedDepartments() {
        List<String> departments = List.of(
                "Engineering",
                "Product",
                "Design",
                "Marketing",
                "Operations",
                "Human Resources"
        );
        for (String name : departments) {
            if (departmentRepository.findByName(name).isEmpty()) {
                departmentRepository.save(Department.builder()
                        .name(name)
                        .isActive(true)
                        .build());
            }
        }
    }

    private void seedJobTitles() {
        // Map of title -> [departmentName, level]
        Map<String, Object[]> titles = Map.of(
                "Software Engineer",        new Object[]{"Engineering", JobLevel.MID},
                "Senior Software Engineer", new Object[]{"Engineering", JobLevel.SENIOR},
                "Engineering Lead",         new Object[]{"Engineering", JobLevel.LEAD},
                "Product Manager",          new Object[]{"Product", JobLevel.MANAGER},
                "UI/UX Designer",           new Object[]{"Design", JobLevel.MID},
                "Senior Designer",          new Object[]{"Design", JobLevel.SENIOR},
                "HR Specialist",            new Object[]{"Human Resources", JobLevel.MID},
                "Marketing Specialist",     new Object[]{"Marketing", JobLevel.MID}
        );

        titles.forEach((title, meta) -> {
            if (jobTitleRepository.findByTitle(title).isEmpty()) {
                String deptName = (String) meta[0];
                JobLevel level = (JobLevel) meta[1];
                departmentRepository.findByName(deptName).ifPresent(dept ->
                        jobTitleRepository.save(JobTitle.builder()
                                .title(title)
                                .level(level)
                                .department(dept)
                                .isActive(true)
                                .build())
                );
            }
        });
    }
}
