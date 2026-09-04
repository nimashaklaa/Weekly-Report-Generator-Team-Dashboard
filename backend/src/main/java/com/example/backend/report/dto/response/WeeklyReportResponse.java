package com.example.backend.report.dto.response;

import com.example.backend.report.enums.MoodType;
import com.example.backend.report.enums.ReportStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class WeeklyReportResponse {

    private Integer id;

    private Integer authorId;
    private String authorName;

    private Integer reviewerId;
    private String reviewerName;

    private Integer teamId;
    private String teamName;

    private Integer weekYear;
    private Integer weekNumber;

    private ReportStatus status;
    private String weekSummary;
    private MoodType overallMood;
    private String blockers;
    private String nextWeekPlan;
    private String generalNotes;

    private Integer currentVersion;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;

    private LocalDateTime createdDate;
    private LocalDateTime lastModifiedDate;

    private List<ReportTaskResponse> tasks;
    private HoursBreakdownResponse hoursBreakdown;
    private List<ReportCommentResponse> comments;
}