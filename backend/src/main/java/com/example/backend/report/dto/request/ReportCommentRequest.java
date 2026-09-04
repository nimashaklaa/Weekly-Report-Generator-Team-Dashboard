package com.example.backend.report.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportCommentRequest {

    @NotBlank
    private String body;

    private boolean correctionRequest = false;

    private Integer versionNumber;
}