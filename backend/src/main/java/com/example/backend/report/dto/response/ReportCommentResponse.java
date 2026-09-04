package com.example.backend.report.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReportCommentResponse {

    private Integer id;

    private Integer authorId;
    private String authorName;

    private String body;
    private boolean correctionRequest;
    private Integer versionNumber;

    private LocalDateTime createdDate;
}