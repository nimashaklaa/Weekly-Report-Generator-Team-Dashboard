package com.example.backend.report;

import com.example.backend.common.exception.ForbiddenActionException;
import com.example.backend.notification.repository.NotificationRepository;
import com.example.backend.project.repository.CategoryRepository;
import com.example.backend.project.repository.ProjectRepository;
import com.example.backend.report.enums.ReportStatus;
import com.example.backend.report.model.ReportComment;
import com.example.backend.report.model.ReportHoursBreakdown;
import com.example.backend.report.model.ReportTask;
import com.example.backend.report.model.WeeklyReport;
import com.example.backend.report.repository.*;
import com.example.backend.report.service.ReportService;
import com.example.backend.role.Role;
import com.example.backend.team.model.Team;
import com.example.backend.team.repository.TeamRepository;
import com.example.backend.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Pure unit tests for service-layer RBAC logic in {@link ReportService}.
 *
 * <p>Tests cover:
 * <ul>
 *   <li>View access: author, manager, admin vs. unrelated team member</li>
 *   <li>Edit access: author-only, status gating (DRAFT / NEEDS_CORRECTION)</li>
 *   <li>Delete access: author-only, DRAFT-only</li>
 *   <li>Submit access: author-only, valid status transition</li>
 *   <li>Approve access: status gating (SUBMITTED only)</li>
 * </ul>
 *
 * No Spring context is loaded — repositories are mocked with Mockito.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReportService — RBAC")
class ReportServiceRbacTest {

    // ── Mocks ─────────────────────────────────────────────────────────────────

    @Mock private WeeklyReportRepository   reportRepository;
    @Mock private ReportTaskRepository     taskRepository;
    @Mock private ReportHoursBreakdownRepository hoursRepository;
    @Mock private ReportVersionRepository  versionRepository;
    @Mock private ReportCommentRepository  commentRepository;
    @Mock private TeamRepository           teamRepository;
    @Mock private ProjectRepository        projectRepository;
    @Mock private CategoryRepository       categoryRepository;
    @Mock private NotificationRepository   notificationRepository;
    @Mock private ObjectMapper             objectMapper;

    @InjectMocks
    private ReportService reportService;

    // ── Shared test fixtures ───────────────────────────────────────────────────

    private User authorUser;
    private User managerUser;
    private User adminUser;
    private User strangerUser;
    private Team team;

    @BeforeEach
    void setUp() {
        authorUser  = userWith(1,  "TEAM_MEMBER");
        strangerUser = userWith(2, "TEAM_MEMBER");
        managerUser = userWith(3,  "MANAGER");
        adminUser   = userWith(4,  "ADMIN");

        managerUser.setFirstName("Manager");
        managerUser.setLastName("Bob");

        team = new Team();
        team.setId(10);
        team.setManager(managerUser);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User userWith(int id, String... roleNames) {
        User user = new User();
        user.setId(id);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail("user" + id + "@example.com");
        user.setEnabled(true);
        user.setAccountLocked(false);
        List<Role> roles = java.util.Arrays.stream(roleNames).map(name -> {
            Role role = new Role();
            role.setName(name);
            return role;
        }).toList();
        user.setRoles(roles);
        return user;
    }

    private WeeklyReport reportWith(User author, ReportStatus status) {
        WeeklyReport report = new WeeklyReport();
        report.setId(100);
        report.setAuthor(author);
        report.setTeam(team);
        report.setStatus(status);
        report.setWeekYear(2026);
        report.setWeekNumber(36);
        report.setCurrentVersion(1);
        return report;
    }

    private WeeklyReport reportWithTask(User author, ReportStatus status) {
        WeeklyReport report = reportWith(author, status);
        ReportTask task = new ReportTask();
        task.setId(200);
        task.setTitle("Sample task");
        task.setReport(report);
        report.setTasks(List.of(task));
        return report;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // VIEW ACCESS  (assertCanView)
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("getReport — view access")
    class ViewAccess {

        @Test
        @DisplayName("author can view their own report")
        void author_canView() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.DRAFT);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatCode(() -> reportService.getReport(100, authorUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("manager can view any report")
        void manager_canView() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.SUBMITTED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatCode(() -> reportService.getReport(100, managerUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("admin can view any report")
        void admin_canView() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.APPROVED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatCode(() -> reportService.getReport(100, adminUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("unrelated team member cannot view another member's report")
        void stranger_cannotView() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.SUBMITTED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.getReport(100, strangerUser))
                    .isInstanceOf(ForbiddenActionException.class);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // EDIT ACCESS  (assertEditable)
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("deleteReport — edit / author-only access")
    class EditAccess {

        @Test
        @DisplayName("author can delete a DRAFT report")
        void author_canDeleteDraft() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.DRAFT);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatCode(() -> reportService.deleteReport(100, authorUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("non-author cannot delete a report")
        void nonAuthor_cannotDelete() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.DRAFT);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.deleteReport(100, strangerUser))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessageContaining("author");
        }

        @Test
        @DisplayName("manager cannot delete another user's report")
        void manager_cannotDeleteOthersReport() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.DRAFT);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.deleteReport(100, managerUser))
                    .isInstanceOf(ForbiddenActionException.class);
        }

        @Test
        @DisplayName("author cannot delete a SUBMITTED report")
        void author_cannotDeleteSubmitted() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.SUBMITTED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.deleteReport(100, authorUser))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessageContaining("DRAFT");
        }

        @Test
        @DisplayName("author cannot delete an APPROVED report")
        void author_cannotDeleteApproved() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.APPROVED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.deleteReport(100, authorUser))
                    .isInstanceOf(ForbiddenActionException.class);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // SUBMIT ACCESS
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("submitReport — author-only, valid status transitions")
    class SubmitAccess {

        @Test
        @DisplayName("author can submit a DRAFT report that has at least one task")
        void author_canSubmitDraft() {
            WeeklyReport report = reportWithTask(authorUser, ReportStatus.DRAFT);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));
            when(notificationRepository.save(any())).thenReturn(null);

            assertThatCode(() -> reportService.submitReport(100, authorUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("author can resubmit a NEEDS_CORRECTION report")
        void author_canSubmitNeedsCorrection() {
            WeeklyReport report = reportWithTask(authorUser, ReportStatus.NEEDS_CORRECTION);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));
            when(notificationRepository.save(any())).thenReturn(null);

            assertThatCode(() -> reportService.submitReport(100, authorUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("non-author cannot submit a report")
        void nonAuthor_cannotSubmit() {
            WeeklyReport report = reportWithTask(authorUser, ReportStatus.DRAFT);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.submitReport(100, strangerUser))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessageContaining("author");
        }

        @Test
        @DisplayName("cannot submit an already APPROVED report")
        void cannotSubmit_whenApproved() {
            WeeklyReport report = reportWithTask(authorUser, ReportStatus.APPROVED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.submitReport(100, authorUser))
                    .isInstanceOf(ForbiddenActionException.class);
        }

        @Test
        @DisplayName("cannot submit a report with no tasks")
        void cannotSubmit_withNoTasks() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.DRAFT);
            report.setTasks(List.of());
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.submitReport(100, authorUser))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // APPROVE ACCESS
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("approveReport — status gating (SUBMITTED only)")
    class ApproveAccess {

        @Test
        @DisplayName("can approve a SUBMITTED report")
        void canApprove_whenSubmitted() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.SUBMITTED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));
            when(notificationRepository.save(any())).thenReturn(null);

            assertThatCode(() -> reportService.approveReport(100, managerUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("cannot approve a DRAFT report")
        void cannotApprove_whenDraft() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.DRAFT);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.approveReport(100, managerUser))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessageContaining("SUBMITTED");
        }

        @Test
        @DisplayName("cannot approve an already APPROVED report")
        void cannotApprove_whenAlreadyApproved() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.APPROVED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.approveReport(100, managerUser))
                    .isInstanceOf(ForbiddenActionException.class);
        }

        @Test
        @DisplayName("cannot approve a NEEDS_CORRECTION report")
        void cannotApprove_whenNeedsCorrection() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.NEEDS_CORRECTION);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            assertThatThrownBy(() -> reportService.approveReport(100, managerUser))
                    .isInstanceOf(ForbiddenActionException.class);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // REQUEST CORRECTION ACCESS
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("requestCorrection — SUBMITTED only")
    class RequestCorrectionAccess {

        @Test
        @DisplayName("can request correction on a SUBMITTED report")
        void canRequestCorrection_whenSubmitted() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.SUBMITTED);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));
            when(commentRepository.save(any(ReportComment.class))).thenAnswer(i -> i.getArgument(0));
            when(notificationRepository.save(any())).thenReturn(null);

            var commentReq = new com.example.backend.report.dto.request.ReportCommentRequest();
            commentReq.setBody("Please fix the blockers section.");

            assertThatCode(() -> reportService.requestCorrection(100, commentReq, managerUser))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("cannot request correction on a DRAFT report")
        void cannotRequestCorrection_whenDraft() {
            WeeklyReport report = reportWith(authorUser, ReportStatus.DRAFT);
            when(reportRepository.findById(100)).thenReturn(Optional.of(report));

            var commentReq = new com.example.backend.report.dto.request.ReportCommentRequest();
            commentReq.setBody("Correction note.");

            assertThatThrownBy(() -> reportService.requestCorrection(100, commentReq, managerUser))
                    .isInstanceOf(ForbiddenActionException.class)
                    .hasMessageContaining("SUBMITTED");
        }
    }
}
