package com.example.backend.report.repository;

import com.example.backend.report.model.ReportVersion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportVersionRepository extends JpaRepository<ReportVersion, Integer> {
}
