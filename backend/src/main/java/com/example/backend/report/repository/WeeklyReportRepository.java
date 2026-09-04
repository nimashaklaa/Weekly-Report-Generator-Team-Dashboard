package com.example.backend.report.repository;

import com.example.backend.report.model.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, Integer> {
}
