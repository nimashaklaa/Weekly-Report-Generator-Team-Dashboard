package com.example.backend.report.repository;

import com.example.backend.report.model.ReportComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportCommentRepository extends JpaRepository<ReportComment, Integer> {
    List<ReportComment> findByReportIdOrderByCreatedDateAsc(Integer reportId);
}