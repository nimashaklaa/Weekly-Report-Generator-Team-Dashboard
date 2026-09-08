package com.example.backend.report.repository;

import com.example.backend.report.enums.ReportStatus;
import com.example.backend.report.enums.TaskStatus;
import com.example.backend.report.model.ReportTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReportTaskRepository extends JpaRepository<ReportTask, Integer> {
    List<ReportTask> findByReportIdOrderBySortOrder(Integer reportId);

    @Query("SELECT COUNT(t) FROM ReportTask t WHERE t.status = :taskStatus AND t.report.status NOT IN :excludedStatuses")
    long countByTaskStatusAndReportStatusNotIn(
            @Param("taskStatus") TaskStatus taskStatus,
            @Param("excludedStatuses") List<ReportStatus> excludedStatuses);

    @Query("SELECT COALESCE(t.project.name, 'Unassigned'), SUM(COALESCE(t.hoursSpent, 0)) " +
           "FROM ReportTask t WHERE t.report.team.id = :teamId AND t.report.status IN :statuses " +
           "GROUP BY t.project.name ORDER BY SUM(t.hoursSpent) DESC")
    List<Object[]> sumHoursByProjectForTeam(
            @Param("teamId") Integer teamId,
            @Param("statuses") List<ReportStatus> statuses);

    @Query("SELECT COALESCE(t.category.name, 'Uncategorized'), SUM(COALESCE(t.hoursSpent, 0)) " +
           "FROM ReportTask t WHERE t.report.team.id = :teamId AND t.report.status IN :statuses " +
           "GROUP BY t.category.name ORDER BY SUM(t.hoursSpent) DESC")
    List<Object[]> sumHoursByCategoryForTeam(
            @Param("teamId") Integer teamId,
            @Param("statuses") List<ReportStatus> statuses);
}