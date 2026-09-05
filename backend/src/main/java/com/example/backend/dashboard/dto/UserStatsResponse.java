package com.example.backend.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Builder
public class UserStatsResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private long totalReports;
    private long approvedReports;
    private long submittedReports;
    private long needsCorrectionReports;
    private double approvalRate;
    private Map<String, Long> moodBreakdown;
    private BigDecimal averageHoursPerWeek;
}
