package com.example.backend.report.service;

import com.example.backend.common.exception.ForbiddenActionException;
import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.notification.enums.NotificationType;
import com.example.backend.notification.model.Notification;
import com.example.backend.notification.repository.NotificationRepository;
import com.example.backend.project.repository.CategoryRepository;
import com.example.backend.project.repository.ProjectRepository;
import com.example.backend.report.dto.request.HoursBreakdownRequest;
import com.example.backend.report.dto.request.ReportCommentRequest;
import com.example.backend.report.dto.request.ReportTaskRequest;
import com.example.backend.report.dto.request.WeeklyReportRequest;
import com.example.backend.report.dto.response.*;
import com.example.backend.report.enums.ReportStatus;
import com.example.backend.report.model.*;
import com.example.backend.report.repository.*;
import com.example.backend.team.repository.TeamRepository;
import com.example.backend.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportService {

    private final WeeklyReportRepository reportRepository;
    private final ReportTaskRepository taskRepository;
    private final ReportHoursBreakdownRepository hoursRepository;
    private final ReportVersionRepository versionRepository;
    private final ReportCommentRepository commentRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    // ─── CREATE ───────────────────────────────────────────────────────────────

    public WeeklyReportResponse createReport(WeeklyReportRequest request, User currentUser) {
        if (reportRepository.existsByAuthorIdAndWeekYearAndWeekNumber(
                currentUser.getId(), request.getWeekYear(), request.getWeekNumber())) {
            throw new IllegalStateException(
                    "A report already exists for week " + request.getWeekNumber() + " of " + request.getWeekYear());
        }

        var team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        var report = WeeklyReport.builder()
                .author(currentUser)
                .team(team)
                .weekYear(request.getWeekYear())
                .weekNumber(request.getWeekNumber())
                .status(ReportStatus.DRAFT)
                .weekSummary(request.getWeekSummary())
                .overallMood(request.getOverallMood())
                .blockers(request.getBlockers())
                .nextWeekPlan(request.getNextWeekPlan())
                .generalNotes(request.getGeneralNotes())
                .currentVersion(1)
                .build();

        reportRepository.save(report);

        if (request.getTasks() != null) {
            request.getTasks().forEach(t -> saveTask(report, t));
        }
        if (request.getHoursBreakdown() != null) {
            saveHoursBreakdown(report, request.getHoursBreakdown());
        }

        return toResponse(report);
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    public WeeklyReportResponse updateReport(Integer id, WeeklyReportRequest request, User currentUser) {
        var report = findReport(id);
        assertEditable(report, currentUser);

        report.setWeekSummary(request.getWeekSummary());
        report.setOverallMood(request.getOverallMood());
        report.setBlockers(request.getBlockers());
        report.setNextWeekPlan(request.getNextWeekPlan());
        report.setGeneralNotes(request.getGeneralNotes());

        if (request.getTasks() != null) {
            taskRepository.deleteAll(report.getTasks());
            report.getTasks().clear();
            request.getTasks().forEach(t -> saveTask(report, t));
        }

        if (request.getHoursBreakdown() != null) {
            if (report.getHoursBreakdown() != null) {
                hoursRepository.delete(report.getHoursBreakdown());
            }
            saveHoursBreakdown(report, request.getHoursBreakdown());
        }

        return toResponse(reportRepository.save(report));
    }

    // ─── READ ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WeeklyReportResponse getReport(Integer id, User currentUser) {
        var report = findReport(id);
        assertCanView(report, currentUser);
        return toResponse(report);
    }

    @Transactional(readOnly = true)
    public List<WeeklyReportSummaryResponse> getMyReports(User currentUser) {
        return reportRepository.findByAuthorIdOrderByWeekYearDescWeekNumberDesc(currentUser.getId())
                .stream().map(this::toSummaryResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<WeeklyReportSummaryResponse> getAllReports(
            Integer weekYear, Integer weekNumber, ReportStatus status,
            Integer authorId, Integer teamId, Pageable pageable) {
        return reportRepository.findWithFilters(weekYear, weekNumber, status, authorId, teamId, pageable)
                .map(this::toSummaryResponse);
    }

    // ─── WORKFLOW ─────────────────────────────────────────────────────────────

    public WeeklyReportResponse submitReport(Integer id, User currentUser) {
        var report = findReport(id);

        if (!report.getAuthor().getId().equals(currentUser.getId())) {
            throw new ForbiddenActionException("Only the author can submit this report");
        }
        if (report.getStatus() != ReportStatus.DRAFT && report.getStatus() != ReportStatus.NEEDS_CORRECTION) {
            throw new ForbiddenActionException("Only DRAFT or NEEDS_CORRECTION reports can be submitted");
        }
        if (report.getTasks() == null || report.getTasks().isEmpty()) {
            throw new IllegalStateException("Report must have at least one task before submitting");
        }

        if (report.getStatus() == ReportStatus.NEEDS_CORRECTION) {
            saveVersionSnapshot(report);
            report.setCurrentVersion(report.getCurrentVersion() + 1);
        }

        report.setStatus(ReportStatus.SUBMITTED);
        report.setSubmittedAt(LocalDateTime.now());
        reportRepository.save(report);

        notify(report.getTeam().getManager(), currentUser,
                NotificationType.REPORT_SUBMITTED,
                "New report submitted",
                currentUser.fullName() + " submitted their week " + report.getWeekNumber() + " report",
                report);

        return toResponse(report);
    }

    public WeeklyReportResponse approveReport(Integer id, User currentUser) {
        var report = findReport(id);

        if (report.getStatus() != ReportStatus.SUBMITTED) {
            throw new ForbiddenActionException("Only SUBMITTED reports can be approved");
        }

        report.setStatus(ReportStatus.APPROVED);
        report.setReviewer(currentUser);
        report.setReviewedAt(LocalDateTime.now());
        reportRepository.save(report);

        notify(report.getAuthor(), currentUser,
                NotificationType.REPORT_APPROVED,
                "Report approved",
                "Your week " + report.getWeekNumber() + " report has been approved by " + currentUser.fullName(),
                report);

        return toResponse(report);
    }

    public WeeklyReportResponse requestCorrection(Integer id, ReportCommentRequest commentRequest, User currentUser) {
        var report = findReport(id);

        if (report.getStatus() != ReportStatus.SUBMITTED) {
            throw new ForbiddenActionException("Only SUBMITTED reports can be sent for correction");
        }

        commentRepository.save(ReportComment.builder()
                .report(report)
                .author(currentUser)
                .body(commentRequest.getBody())
                .isCorrectionRequest(true)
                .versionNumber(report.getCurrentVersion())
                .build());

        report.setStatus(ReportStatus.NEEDS_CORRECTION);
        report.setReviewer(currentUser);
        report.setReviewedAt(LocalDateTime.now());
        reportRepository.save(report);

        notify(report.getAuthor(), currentUser,
                NotificationType.REPORT_NEEDS_CORRECTION,
                "Correction requested",
                currentUser.fullName() + " requested corrections on your week " + report.getWeekNumber() + " report",
                report);

        return toResponse(report);
    }

    // ─── TASKS ────────────────────────────────────────────────────────────────

    public ReportTaskResponse addTask(Integer reportId, ReportTaskRequest request, User currentUser) {
        var report = findReport(reportId);
        assertEditable(report, currentUser);
        return toTaskResponse(saveTask(report, request));
    }

    public ReportTaskResponse updateTask(Integer reportId, Integer taskId, ReportTaskRequest request, User currentUser) {
        var report = findReport(reportId);
        assertEditable(report, currentUser);
        var task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!task.getReport().getId().equals(reportId)) {
            throw new ForbiddenActionException("Task does not belong to this report");
        }
        applyTaskRequest(task, request);
        return toTaskResponse(taskRepository.save(task));
    }

    public void deleteTask(Integer reportId, Integer taskId, User currentUser) {
        var report = findReport(reportId);
        assertEditable(report, currentUser);
        var task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        if (!task.getReport().getId().equals(reportId)) {
            throw new ForbiddenActionException("Task does not belong to this report");
        }
        taskRepository.delete(task);
    }

    public void reorderTasks(Integer reportId, List<Integer> orderedIds, User currentUser) {
        var report = findReport(reportId);
        assertEditable(report, currentUser);
        for (int i = 0; i < orderedIds.size(); i++) {
            final int sortOrder = i;
            taskRepository.findById(orderedIds.get(i)).ifPresent(t -> {
                t.setSortOrder(sortOrder);
                taskRepository.save(t);
            });
        }
    }

    // ─── VERSIONS ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ReportVersionResponse> getVersions(Integer reportId, User currentUser) {
        var report = findReport(reportId);
        assertCanView(report, currentUser);
        return versionRepository.findByReportIdOrderByVersionNumberDesc(reportId)
                .stream().map(this::toVersionResponse).toList();
    }

    @Transactional(readOnly = true)
    public ReportVersionResponse getVersion(Integer reportId, Integer versionNumber, User currentUser) {
        var report = findReport(reportId);
        assertCanView(report, currentUser);
        return versionRepository.findByReportIdAndVersionNumber(reportId, versionNumber)
                .map(this::toVersionResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Version " + versionNumber + " not found"));
    }

    // ─── COMMENTS ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ReportCommentResponse> getComments(Integer reportId, User currentUser) {
        var report = findReport(reportId);
        assertCanView(report, currentUser);
        return commentRepository.findByReportIdOrderByCreatedDateAsc(reportId)
                .stream().map(this::toCommentResponse).toList();
    }

    public ReportCommentResponse addComment(Integer reportId, ReportCommentRequest request, User currentUser) {
        var report = findReport(reportId);
        assertCanView(report, currentUser);
        return toCommentResponse(commentRepository.save(ReportComment.builder()
                .report(report)
                .author(currentUser)
                .body(request.getBody())
                .isCorrectionRequest(request.isCorrectionRequest())
                .versionNumber(request.getVersionNumber())
                .build()));
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private WeeklyReport findReport(Integer id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
    }

    private void assertEditable(WeeklyReport report, User currentUser) {
        if (!report.getAuthor().getId().equals(currentUser.getId())) {
            throw new ForbiddenActionException("You are not the author of this report");
        }
        if (report.getStatus() != ReportStatus.DRAFT && report.getStatus() != ReportStatus.NEEDS_CORRECTION) {
            throw new ForbiddenActionException("Report cannot be edited in its current status: " + report.getStatus());
        }
    }

    private void assertCanView(WeeklyReport report, User currentUser) {
        boolean isAuthor = report.getAuthor().getId().equals(currentUser.getId());
        boolean isManagerOrAdmin = hasRole(currentUser, "MANAGER") || hasRole(currentUser, "ADMIN");
        if (!isAuthor && !isManagerOrAdmin) {
            throw new ForbiddenActionException("You do not have permission to view this report");
        }
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles().stream().anyMatch(r -> r.getName().equals(roleName));
    }

    private ReportTask saveTask(WeeklyReport report, ReportTaskRequest request) {
        var task = new ReportTask();
        task.setReport(report);
        applyTaskRequest(task, request);
        return taskRepository.save(task);
    }

    private void applyTaskRequest(ReportTask task, ReportTaskRequest request) {
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : task.getStatus());
        task.setPriority(request.getPriority());
        task.setHoursSpent(request.getHoursSpent());
        task.setPlannedPct(request.getPlannedPct());
        task.setActualPct(request.getActualPct());
        task.setTimePlanned(request.getTimePlanned());
        task.setOutputDeliverable(request.getOutputDeliverable());
        task.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        task.setProject(request.getProjectId() != null
                ? projectRepository.findById(request.getProjectId()).orElse(null)
                : null);
        task.setCategory(request.getCategoryId() != null
                ? categoryRepository.findById(request.getCategoryId()).orElse(null)
                : null);
    }

    private void saveHoursBreakdown(WeeklyReport report, HoursBreakdownRequest request) {
        var hours = new ReportHoursBreakdown();
        hours.setReport(report);
        hours.setMeeting_hours(request.getMeetingHours());
        hours.setDeep_work_hours(request.getDeepWorkHours());
        hours.setAdmin_hours(request.getAdminHours());
        hours.setReview_hours(request.getReviewHours());
        hours.setOther_hours(request.getOtherHours());
        hours.setTotal_hours(request.getTotalHours());
        hoursRepository.save(hours);
    }

    @SneakyThrows
    private void saveVersionSnapshot(WeeklyReport report) {
        String json = objectMapper.writeValueAsString(toResponse(report));
        versionRepository.save(ReportVersion.builder()
                .report(report)
                .versionNumber(report.getCurrentVersion())
                .snapshot_json(json)
                .build());
    }

    private void notify(User recipient, User sender, NotificationType type,
                        String title, String message, WeeklyReport report) {
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(type)
                .title(title)
                .message(message)
                .relatedReport(report)
                .isRead(false)
                .build());
    }

    // ─── MAPPERS ──────────────────────────────────────────────────────────────

    private WeeklyReportResponse toResponse(WeeklyReport r) {
        return WeeklyReportResponse.builder()
                .id(r.getId())
                .authorId(r.getAuthor().getId())
                .authorName(r.getAuthor().fullName())
                .reviewerId(r.getReviewer() != null ? r.getReviewer().getId() : null)
                .reviewerName(r.getReviewer() != null ? r.getReviewer().fullName() : null)
                .teamId(r.getTeam().getId())
                .teamName(r.getTeam().getName())
                .weekYear(r.getWeekYear())
                .weekNumber(r.getWeekNumber())
                .status(r.getStatus())
                .weekSummary(r.getWeekSummary())
                .overallMood(r.getOverallMood())
                .blockers(r.getBlockers())
                .nextWeekPlan(r.getNextWeekPlan())
                .generalNotes(r.getGeneralNotes())
                .currentVersion(r.getCurrentVersion())
                .submittedAt(r.getSubmittedAt())
                .reviewedAt(r.getReviewedAt())
                .createdDate(r.getCreatedDate())
                .lastModifiedDate(r.getLastModifiedDate())
                .tasks(r.getTasks() != null
                        ? r.getTasks().stream().map(this::toTaskResponse).toList()
                        : List.of())
                .hoursBreakdown(r.getHoursBreakdown() != null ? toHoursResponse(r.getHoursBreakdown()) : null)
                .comments(r.getComments() != null
                        ? r.getComments().stream().map(this::toCommentResponse).toList()
                        : List.of())
                .build();
    }

    private WeeklyReportSummaryResponse toSummaryResponse(WeeklyReport r) {
        return WeeklyReportSummaryResponse.builder()
                .id(r.getId())
                .authorId(r.getAuthor().getId())
                .authorName(r.getAuthor().fullName())
                .teamId(r.getTeam().getId())
                .teamName(r.getTeam().getName())
                .weekYear(r.getWeekYear())
                .weekNumber(r.getWeekNumber())
                .status(r.getStatus())
                .overallMood(r.getOverallMood())
                .currentVersion(r.getCurrentVersion())
                .submittedAt(r.getSubmittedAt())
                .createdDate(r.getCreatedDate())
                .build();
    }

    private ReportTaskResponse toTaskResponse(ReportTask t) {
        return ReportTaskResponse.builder()
                .id(t.getId())
                .projectId(t.getProject() != null ? t.getProject().getId() : null)
                .projectName(t.getProject() != null ? t.getProject().getName() : null)
                .categoryId(t.getCategory() != null ? t.getCategory().getId() : null)
                .categoryName(t.getCategory() != null ? t.getCategory().getName() : null)
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .hoursSpent(t.getHoursSpent())
                .plannedPct(t.getPlannedPct())
                .actualPct(t.getActualPct())
                .timePlanned(t.getTimePlanned())
                .outputDeliverable(t.getOutputDeliverable())
                .sortOrder(t.getSortOrder())
                .build();
    }

    private HoursBreakdownResponse toHoursResponse(ReportHoursBreakdown h) {
        return HoursBreakdownResponse.builder()
                .id(h.getId())
                .meetingHours(h.getMeeting_hours())
                .deepWorkHours(h.getDeep_work_hours())
                .adminHours(h.getAdmin_hours())
                .reviewHours(h.getReview_hours())
                .otherHours(h.getOther_hours())
                .totalHours(h.getTotal_hours())
                .build();
    }

    private ReportCommentResponse toCommentResponse(ReportComment c) {
        return ReportCommentResponse.builder()
                .id(c.getId())
                .authorId(c.getAuthor().getId())
                .authorName(c.getAuthor().fullName())
                .body(c.getBody())
                .correctionRequest(c.isCorrectionRequest())
                .versionNumber(c.getVersionNumber())
                .createdDate(c.getCreatedDate())
                .build();
    }

    private ReportVersionResponse toVersionResponse(ReportVersion v) {
        return ReportVersionResponse.builder()
                .id(v.getId())
                .versionNumber(v.getVersionNumber())
                .snapshotJson(v.getSnapshot_json())
                .createdDate(v.getCreatedDate())
                .build();
    }
}