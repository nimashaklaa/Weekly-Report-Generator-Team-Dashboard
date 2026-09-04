package com.example.backend.report.repository;

import com.example.backend.report.model.ReportVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportVersionRepository extends JpaRepository<ReportVersion, Integer> {
    List<ReportVersion> findByReportIdOrderByVersionNumberDesc(Integer reportId);
    Optional<ReportVersion> findByReportIdAndVersionNumber(Integer reportId, Integer versionNumber);
}