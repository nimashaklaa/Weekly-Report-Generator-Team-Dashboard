package com.example.backend.report.model;

import com.example.backend.common.BaseEntity;
import com.example.backend.report.enums.MoodType;
import com.example.backend.report.enums.ReportStatus;
import com.example.backend.team.Team;
import com.example.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
    name = "weekly_reports",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_report_author_week",
            columnNames = {"author_id", "week_year", "week_number"}
        )
    },
    indexes = {
        @Index(name = "idx_report_author", columnList = "author_id"),
        @Index(name = "idx_report_status", columnList = "status"),
        @Index(name = "idx_report_week", columnList = "week_year, week_number")
    }
)
public class WeeklyReport extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private Integer weekYear;

    @Column(nullable = false)
    private Integer weekNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status = ReportStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String weekSummary;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MoodType overallMood;

    @Column(columnDefinition = "TEXT")
    private String blockers;

    @Column(columnDefinition = "TEXT")
    private String nextWeekPlan;

    @Column(columnDefinition = "TEXT")
    private String generalNotes;

    @Column(nullable = false)
    private Integer currentVersion = 1;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReportTask> tasks;

    @OneToOne(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private ReportHoursBreakdown hoursBreakdown;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReportVersion> versions;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReportComment> comments;
}