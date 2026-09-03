package com.example.backend.report.model;

import com.example.backend.common.BaseEntity;
import com.example.backend.project.Category;
import com.example.backend.project.Project;
import com.example.backend.report.enums.TaskPriority;
import com.example.backend.report.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Getter
@Setter
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
    name = "report_tasks",
    indexes = {
        @Index(name = "idx_task_report", columnList = "report_id"),
        @Index(name = "idx_task_project", columnList = "project_id")
    }
)
public class ReportTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private WeeklyReport report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.IN_PROGRESS;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private TaskPriority priority;

    @Column(precision = 5, scale = 2)
    private BigDecimal hoursSpent;

    @Column(precision = 5, scale = 2)
    private BigDecimal plannedPct;

    @Column(precision = 5, scale = 2)
    private BigDecimal actualPct;

    @Column(precision = 5, scale = 2)
    private BigDecimal timePlanned;

    @Column(columnDefinition = "TEXT")
    private String outputDeliverable;

    @Column(nullable = false)
    private Integer sortOrder = 0;
}