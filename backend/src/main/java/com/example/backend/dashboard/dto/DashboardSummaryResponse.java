package com.example.backend.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardSummaryResponse {
    private long totalUsers;
    private long totalTeams;
    private long totalActiveProjects;
    private int currentWeekYear;
    private int currentWeekNumber;
    private ReportStatusBreakdown reportsThisWeek;
    private long pendingReviews;
}
