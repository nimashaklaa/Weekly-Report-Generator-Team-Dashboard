package com.example.backend.report.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class HoursBreakdownRequest {

    private BigDecimal meetingHours;

    private BigDecimal deepWorkHours;

    private BigDecimal adminHours;

    private BigDecimal reviewHours;

    private BigDecimal otherHours;

    private BigDecimal totalHours;
}