package com.example.backend.report.repository;

import com.example.backend.report.model.ReportTask;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportTaskRepository extends JpaRepository<ReportTask, Integer> {
}
