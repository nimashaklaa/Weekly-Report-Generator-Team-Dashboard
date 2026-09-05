package com.example.backend.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TeamReportStatsResponse {
    private Integer teamId;
    private String teamName;
    private int weekYear;
    private int weekNumber;
    private long totalMembers;
    private long submittedCount;
    private double submissionRate;
    private ReportStatusBreakdown statusBreakdown;
    private List<String> missingMembers;
}
