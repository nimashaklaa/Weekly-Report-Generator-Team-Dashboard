package com.example.backend.notification.dto;

import com.example.backend.notification.enums.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {

    private Integer id;
    private NotificationType type;
    private String title;
    private String message;
    private Integer relatedReportId;
    private boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdDate;
}