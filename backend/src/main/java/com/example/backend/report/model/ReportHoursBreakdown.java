package com.example.backend.report.model;

import com.example.backend.common.BaseEntity;
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
@Table(name = "report_hours_breakdown")

public class ReportHoursBreakdown extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private WeeklyReport report;

    @Column(precision = 4, scale = 1)
    private BigDecimal meeting_hours;

    @Column(precision = 4, scale = 1)
    private BigDecimal deep_work_hours;

    @Column(precision = 4, scale = 1)
    private BigDecimal admin_hours;

    @Column(precision = 4, scale = 1)
    private BigDecimal review_hours;

    @Column(precision = 4, scale = 1)
    private BigDecimal other_hours;

    @Column(precision = 5, scale = 1)
    private BigDecimal total_hours;



}
