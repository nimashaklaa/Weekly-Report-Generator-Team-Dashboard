package com.example.backend.report.model;

import com.example.backend.common.BaseEntity;
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
        name = "report_versions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_report_version",
                        columnNames = {"report_id", "version_number"}
                )
        }
)
public class ReportVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private WeeklyReport report;

    @Column(nullable = false)
    private Integer versionNumber = 1;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String snapshot_json;

}