package com.example.backend.report.controller;

import com.example.backend.report.dto.request.ReportCommentRequest;
import com.example.backend.report.dto.request.ReportTaskRequest;
import com.example.backend.report.dto.request.WeeklyReportRequest;
import com.example.backend.report.dto.response.*;
import com.example.backend.report.enums.ReportStatus;
import com.example.backend.report.service.ReportService;
import com.example.backend.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Reports")
public class ReportController {

    private final ReportService reportService;

    // ─── REPORTS ──────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<WeeklyReportResponse> createReport(
            @RequestBody @Valid WeeklyReportRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.createReport(request, currentUser));
    }

    @GetMapping("/my")
    public ResponseEntity<List<WeeklyReportSummaryResponse>> getMyReports(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.getMyReports(currentUser));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<Page<WeeklyReportSummaryResponse>> getAllReports(
            @RequestParam(required = false) Integer weekYear,
            @RequestParam(required = false) Integer weekNumber,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) Integer authorId,
            @RequestParam(required = false) Integer teamId,
            @PageableDefault(size = 20, sort = "createdDate") Pageable pageable
    ) {
        return ResponseEntity.ok(
                reportService.getAllReports(weekYear, weekNumber, status, authorId, teamId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WeeklyReportResponse> getReport(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.getReport(id, currentUser));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WeeklyReportResponse> updateReport(
            @PathVariable Integer id,
            @RequestBody @Valid WeeklyReportRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.updateReport(id, request, currentUser));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<WeeklyReportResponse> patchReport(
            @PathVariable Integer id,
            @RequestBody WeeklyReportRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.updateReport(id, request, currentUser));
    }

    // ─── WORKFLOW ─────────────────────────────────────────────────────────────

    @PostMapping("/{id}/submit")
    public ResponseEntity<WeeklyReportResponse> submitReport(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.submitReport(id, currentUser));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<WeeklyReportResponse> approveReport(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.approveReport(id, currentUser));
    }

    @PostMapping("/{id}/request-correction")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<WeeklyReportResponse> requestCorrection(
            @PathVariable Integer id,
            @RequestBody @Valid ReportCommentRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.requestCorrection(id, request, currentUser));
    }

    // ─── VERSIONS ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<ReportVersionResponse>> getVersions(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.getVersions(id, currentUser));
    }

    @GetMapping("/{id}/versions/{versionNumber}")
    public ResponseEntity<ReportVersionResponse> getVersion(
            @PathVariable Integer id,
            @PathVariable Integer versionNumber,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.getVersion(id, versionNumber, currentUser));
    }

    // ─── COMMENTS ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<ReportCommentResponse>> getComments(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.getComments(id, currentUser));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<ReportCommentResponse> addComment(
            @PathVariable Integer id,
            @RequestBody @Valid ReportCommentRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.addComment(id, request, currentUser));
    }

    // ─── TASKS ────────────────────────────────────────────────────────────────

    @GetMapping("/{reportId}/tasks")
    public ResponseEntity<List<ReportTaskResponse>> getTasks(
            @PathVariable Integer reportId,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.getReport(reportId, currentUser).getTasks());
    }

    @PostMapping("/{reportId}/tasks")
    public ResponseEntity<ReportTaskResponse> addTask(
            @PathVariable Integer reportId,
            @RequestBody @Valid ReportTaskRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.addTask(reportId, request, currentUser));
    }

    @PutMapping("/{reportId}/tasks/{taskId}")
    public ResponseEntity<ReportTaskResponse> updateTask(
            @PathVariable Integer reportId,
            @PathVariable Integer taskId,
            @RequestBody @Valid ReportTaskRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(reportService.updateTask(reportId, taskId, request, currentUser));
    }

    @DeleteMapping("/{reportId}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Integer reportId,
            @PathVariable Integer taskId,
            @AuthenticationPrincipal User currentUser
    ) {
        reportService.deleteTask(reportId, taskId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{reportId}/tasks/reorder")
    public ResponseEntity<Void> reorderTasks(
            @PathVariable Integer reportId,
            @RequestBody List<Integer> orderedIds,
            @AuthenticationPrincipal User currentUser
    ) {
        reportService.reorderTasks(reportId, orderedIds, currentUser);
        return ResponseEntity.noContent().build();
    }
}