package com.example.backend.report.dto.request;

import com.example.backend.report.enums.MoodType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class WeeklyReportRequest {

    @NotNull
    private Integer teamId;

    @NotNull
    @Min(2000)
    private Integer weekYear;

    @NotNull
    @Min(1)
    @Max(53)
    private Integer weekNumber;

    private String weekSummary;

    private MoodType overallMood;

    private String blockers;

    private String nextWeekPlan;

    private String generalNotes;

    @Valid
    private List<ReportTaskRequest> tasks;

    @Valid
    private HoursBreakdownRequest hoursBreakdown;
}