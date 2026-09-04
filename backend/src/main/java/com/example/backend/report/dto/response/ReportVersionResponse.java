package com.example.backend.report.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReportVersionResponse {

    private Integer id;
    private Integer versionNumber;
    private String snapshotJson;
    private LocalDateTime createdDate;
}