package com.example.backend.report.dto.request;

import com.example.backend.report.enums.TaskPriority;
import com.example.backend.report.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ReportTaskRequest {

    private Integer projectId;

    private Integer categoryId;

    @NotBlank
    @Size(max = 300)
    private String title;

    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    private BigDecimal hoursSpent;

    private BigDecimal plannedPct;

    private BigDecimal actualPct;

    private BigDecimal timePlanned;

    private String outputDeliverable;

    private Integer sortOrder = 0;
}