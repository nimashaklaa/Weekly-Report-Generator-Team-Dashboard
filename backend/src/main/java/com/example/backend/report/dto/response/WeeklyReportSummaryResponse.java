package com.example.backend.report.dto.response;

import com.example.backend.report.enums.MoodType;
import com.example.backend.report.enums.ReportStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class WeeklyReportSummaryResponse {

    private Integer id;

    private Integer authorId;
    private String authorName;

    private Integer teamId;
    private String teamName;

    private Integer weekYear;
    private Integer weekNumber;

    private ReportStatus status;
    private MoodType overallMood;

    private Integer currentVersion;
    private LocalDateTime submittedAt;
    private LocalDateTime createdDate;
}