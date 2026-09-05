package com.example.backend.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReportStatusBreakdown {
    private long draft;
    private long submitted;
    private long needsCorrection;
    private long approved;
    private long total;
}
