package com.example.backend.report.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class HoursBreakdownResponse {

    private Integer id;

    private BigDecimal meetingHours;
    private BigDecimal deepWorkHours;
    private BigDecimal adminHours;
    private BigDecimal reviewHours;
    private BigDecimal otherHours;
    private BigDecimal totalHours;
}