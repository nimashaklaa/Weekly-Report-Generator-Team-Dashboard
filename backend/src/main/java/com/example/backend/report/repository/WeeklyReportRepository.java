package com.example.backend.report.repository;

import com.example.backend.report.enums.ReportStatus;
import com.example.backend.report.model.WeeklyReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, Integer> {

    boolean existsByAuthorIdAndWeekYearAndWeekNumber(Integer authorId, Integer weekYear, Integer weekNumber);

    List<WeeklyReport> findByAuthorIdOrderByWeekYearDescWeekNumberDesc(Integer authorId);

    @Query("SELECT r FROM WeeklyReport r WHERE " +
           "(:weekYear IS NULL OR r.weekYear = :weekYear) AND " +
           "(:weekNumber IS NULL OR r.weekNumber = :weekNumber) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:authorId IS NULL OR r.author.id = :authorId) AND " +
           "(:teamId IS NULL OR r.team.id = :teamId)")
    Page<WeeklyReport> findWithFilters(
            @Param("weekYear") Integer weekYear,
            @Param("weekNumber") Integer weekNumber,
            @Param("status") ReportStatus status,
            @Param("authorId") Integer authorId,
            @Param("teamId") Integer teamId,
            Pageable pageable);
}