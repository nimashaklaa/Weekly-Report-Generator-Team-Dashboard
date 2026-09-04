package com.example.backend.report.dto.response;

import com.example.backend.report.enums.TaskPriority;
import com.example.backend.report.enums.TaskStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ReportTaskResponse {

    private Integer id;

    private Integer projectId;
    private String projectName;

    private Integer categoryId;
    private String categoryName;

    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;

    private BigDecimal hoursSpent;
    private BigDecimal plannedPct;
    private BigDecimal actualPct;
    private BigDecimal timePlanned;

    private String outputDeliverable;
    private Integer sortOrder;
}