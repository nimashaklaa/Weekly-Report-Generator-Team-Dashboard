package com.example.backend.report.repository;

import com.example.backend.report.enums.MoodType;
import com.example.backend.report.enums.ReportStatus;
import com.example.backend.report.model.WeeklyReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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

    // --- Dashboard queries ---

    @Query("SELECT COUNT(r) FROM WeeklyReport r WHERE r.weekYear = :weekYear AND r.weekNumber = :weekNumber AND r.status = :status")
    long countByWeekAndStatus(@Param("weekYear") int weekYear, @Param("weekNumber") int weekNumber, @Param("status") ReportStatus status);

    @Query("SELECT COUNT(r) FROM WeeklyReport r WHERE r.weekYear = :weekYear AND r.weekNumber = :weekNumber AND r.team.id = :teamId AND r.status = :status")
    long countByTeamAndWeekAndStatus(@Param("teamId") Integer teamId, @Param("weekYear") int weekYear, @Param("weekNumber") int weekNumber, @Param("status") ReportStatus status);

    @Query("SELECT r.author.id FROM WeeklyReport r WHERE r.team.id = :teamId AND r.weekYear = :weekYear AND r.weekNumber = :weekNumber")
    List<Integer> findAuthorIdsByTeamAndWeek(@Param("teamId") Integer teamId, @Param("weekYear") int weekYear, @Param("weekNumber") int weekNumber);

    @Query("SELECT COUNT(r) FROM WeeklyReport r WHERE r.author.id = :userId")
    long countByAuthor(@Param("userId") Integer userId);

    @Query("SELECT COUNT(r) FROM WeeklyReport r WHERE r.author.id = :userId AND r.status = :status")
    long countByAuthorAndStatus(@Param("userId") Integer userId, @Param("status") ReportStatus status);

    @Query("SELECT r.overallMood, COUNT(r) FROM WeeklyReport r WHERE r.author.id = :userId AND r.overallMood IS NOT NULL GROUP BY r.overallMood")
    List<Object[]> countMoodByAuthor(@Param("userId") Integer userId);

    @Query("SELECT AVG(h.total_hours) FROM ReportHoursBreakdown h WHERE h.report.author.id = :userId AND h.total_hours IS NOT NULL")
    BigDecimal avgHoursByAuthor(@Param("userId") Integer userId);
}
