package com.example.backend.report.repository;

import com.example.backend.report.model.ReportTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportTaskRepository extends JpaRepository<ReportTask, Integer> {
    List<ReportTask> findByReportIdOrderBySortOrder(Integer reportId);
}