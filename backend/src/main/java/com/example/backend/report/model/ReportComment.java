package com.example.backend.report.model;

import com.example.backend.common.BaseEntity;
import com.example.backend.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
    name = "report_comments",
    indexes = {
        @Index(name = "idx_comment_report", columnList = "report_id"),
        @Index(name = "idx_comment_author", columnList = "author_id")
    }
)
public class ReportComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private WeeklyReport report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(nullable = false)
    private boolean isCorrectionRequest = false;

    private Integer versionNumber;
}