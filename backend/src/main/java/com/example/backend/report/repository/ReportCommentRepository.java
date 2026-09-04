package com.example.backend.report.repository;

import com.example.backend.report.model.ReportComment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportCommentRepository extends JpaRepository<ReportComment, Integer> {
}
