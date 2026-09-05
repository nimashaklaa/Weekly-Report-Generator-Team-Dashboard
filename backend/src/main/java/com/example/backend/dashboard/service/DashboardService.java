package com.example.backend.dashboard.service;

import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.dashboard.dto.DashboardSummaryResponse;
import com.example.backend.dashboard.dto.ReportStatusBreakdown;
import com.example.backend.dashboard.dto.TeamReportStatsResponse;
import com.example.backend.dashboard.dto.UserStatsResponse;
import com.example.backend.project.repository.ProjectRepository;
import com.example.backend.report.enums.MoodType;
import com.example.backend.report.enums.ReportStatus;
import com.example.backend.report.repository.WeeklyReportRepository;
import com.example.backend.team.model.Team;
import com.example.backend.team.repository.TeamRepository;
import com.example.backend.user.User;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final WeeklyReportRepository reportRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;

    public DashboardSummaryResponse getSummary() {
        LocalDate today = LocalDate.now();
        WeekFields weekFields = WeekFields.ISO;
        int weekYear = today.getYear();
        int weekNumber = today.get(weekFields.weekOfWeekBasedYear());

        ReportStatusBreakdown breakdown = buildWeekBreakdown(weekYear, weekNumber);

        return DashboardSummaryResponse.builder()
                .totalUsers(userRepository.count())
                .totalTeams(teamRepository.count())
                .totalActiveProjects(projectRepository.countByIsActiveTrue())
                .currentWeekYear(weekYear)
                .currentWeekNumber(weekNumber)
                .reportsThisWeek(breakdown)
                .pendingReviews(breakdown.getSubmitted())
                .build();
    }

    public TeamReportStatsResponse getTeamReportStats(Integer teamId, Integer weekYear, Integer weekNumber) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        // Default to current week if not provided
        LocalDate today = LocalDate.now();
        WeekFields weekFields = WeekFields.ISO;
        int year = weekYear != null ? weekYear : today.getYear();
        int week = weekNumber != null ? weekNumber : today.get(weekFields.weekOfWeekBasedYear());

        List<User> members = team.getMembers();
        long totalMembers = members.size();

        long draft = reportRepository.countByTeamAndWeekAndStatus(teamId, year, week, ReportStatus.DRAFT);
        long submitted = reportRepository.countByTeamAndWeekAndStatus(teamId, year, week, ReportStatus.SUBMITTED);
        long needsCorrection = reportRepository.countByTeamAndWeekAndStatus(teamId, year, week, ReportStatus.NEEDS_CORRECTION);
        long approved = reportRepository.countByTeamAndWeekAndStatus(teamId, year, week, ReportStatus.APPROVED);
        long reportedCount = draft + submitted + needsCorrection + approved;

        double submissionRate = totalMembers > 0
                ? Math.round((reportedCount * 100.0 / totalMembers) * 10) / 10.0
                : 0.0;

        // Find members who have not submitted any report this week
        Set<Integer> reportedAuthorIds = Set.copyOf(reportRepository.findAuthorIdsByTeamAndWeek(teamId, year, week));
        List<String> missingMembers = members.stream()
                .filter(m -> !reportedAuthorIds.contains(m.getId()))
                .map(User::fullName)
                .toList();

        return TeamReportStatsResponse.builder()
                .teamId(teamId)
                .teamName(team.getName())
                .weekYear(year)
                .weekNumber(week)
                .totalMembers(totalMembers)
                .submittedCount(reportedCount)
                .submissionRate(submissionRate)
                .statusBreakdown(ReportStatusBreakdown.builder()
                        .draft(draft)
                        .submitted(submitted)
                        .needsCorrection(needsCorrection)
                        .approved(approved)
                        .total(reportedCount)
                        .build())
                .missingMembers(missingMembers)
                .build();
    }

    public UserStatsResponse getUserStats(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        long total = reportRepository.countByAuthor(userId);
        long approved = reportRepository.countByAuthorAndStatus(userId, ReportStatus.APPROVED);
        long submitted = reportRepository.countByAuthorAndStatus(userId, ReportStatus.SUBMITTED);
        long needsCorrection = reportRepository.countByAuthorAndStatus(userId, ReportStatus.NEEDS_CORRECTION);

        double approvalRate = total > 0
                ? Math.round((approved * 100.0 / total) * 10) / 10.0
                : 0.0;

        Map<String, Long> moodBreakdown = buildMoodBreakdown(userId);
        BigDecimal rawAvg = reportRepository.avgHoursByAuthor(userId);
        BigDecimal avgHours = rawAvg != null ? rawAvg.setScale(1, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return UserStatsResponse.builder()
                .userId(userId)
                .fullName(user.fullName())
                .email(user.getEmail())
                .totalReports(total)
                .approvedReports(approved)
                .submittedReports(submitted)
                .needsCorrectionReports(needsCorrection)
                .approvalRate(approvalRate)
                .moodBreakdown(moodBreakdown)
                .averageHoursPerWeek(avgHours)
                .build();
    }

    private ReportStatusBreakdown buildWeekBreakdown(int weekYear, int weekNumber) {
        long draft = reportRepository.countByWeekAndStatus(weekYear, weekNumber, ReportStatus.DRAFT);
        long submitted = reportRepository.countByWeekAndStatus(weekYear, weekNumber, ReportStatus.SUBMITTED);
        long needsCorrection = reportRepository.countByWeekAndStatus(weekYear, weekNumber, ReportStatus.NEEDS_CORRECTION);
        long approved = reportRepository.countByWeekAndStatus(weekYear, weekNumber, ReportStatus.APPROVED);

        return ReportStatusBreakdown.builder()
                .draft(draft)
                .submitted(submitted)
                .needsCorrection(needsCorrection)
                .approved(approved)
                .total(draft + submitted + needsCorrection + approved)
                .build();
    }

    private Map<String, Long> buildMoodBreakdown(Integer userId) {
        // Pre-fill all moods with 0 so the client always gets a complete map
        Map<String, Long> breakdown = new LinkedHashMap<>();
        for (MoodType mood : MoodType.values()) {
            breakdown.put(mood.name(), 0L);
        }
        List<Object[]> rows = reportRepository.countMoodByAuthor(userId);
        for (Object[] row : rows) {
            MoodType mood = (MoodType) row[0];
            Long count = (Long) row[1];
            breakdown.put(mood.name(), count);
        }
        return breakdown;
    }
}
