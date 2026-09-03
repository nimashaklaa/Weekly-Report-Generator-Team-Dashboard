package com.example.backend.notification.model;

import com.example.backend.common.BaseEntity;
import com.example.backend.notification.enums.NotificationType;
import com.example.backend.report.model.WeeklyReport;
import com.example.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@Setter
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
    name = "notifications",
    indexes = {
        @Index(name = "idx_notification_recipient_read", columnList = "recipient_id, is_read")
    }
)
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_report_id")
    private WeeklyReport relatedReport;

    @Column(nullable = false)
    private boolean isRead = false;

    private LocalDateTime readAt;
}