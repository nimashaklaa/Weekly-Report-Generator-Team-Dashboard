package com.example.backend.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ActivityItemResponse {
    private Integer reportId;
    private String authorName;
    private String reviewerName;
    private String action;
    private Integer weekYear;
    private Integer weekNumber;
    private LocalDateTime timestamp;
}