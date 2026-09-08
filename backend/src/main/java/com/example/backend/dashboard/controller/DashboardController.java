package com.example.backend.dashboard.controller;

import com.example.backend.dashboard.dto.ActivityItemResponse;
import com.example.backend.dashboard.dto.DashboardSummaryResponse;
import com.example.backend.dashboard.dto.TeamReportStatsResponse;
import com.example.backend.dashboard.dto.TeamTaskStatsResponse;
import com.example.backend.dashboard.dto.UserStatsResponse;
import com.example.backend.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/teams/{teamId}/reports")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<TeamReportStatsResponse> getTeamReportStats(
            @PathVariable Integer teamId,
            @RequestParam(required = false) Integer weekYear,
            @RequestParam(required = false) Integer weekNumber
    ) {
        return ResponseEntity.ok(dashboardService.getTeamReportStats(teamId, weekYear, weekNumber));
    }

    @GetMapping("/teams/{teamId}/task-stats")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<TeamTaskStatsResponse> getTeamTaskStats(@PathVariable Integer teamId) {
        return ResponseEntity.ok(dashboardService.getTeamTaskStats(teamId));
    }

    @GetMapping("/teams/{teamId}/activity")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<List<ActivityItemResponse>> getTeamActivity(
            @PathVariable Integer teamId,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(dashboardService.getTeamActivity(teamId, limit));
    }

    @GetMapping("/users/{userId}/stats")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN') or principal.id == #userId")
    public ResponseEntity<UserStatsResponse> getUserStats(@PathVariable Integer userId) {
        return ResponseEntity.ok(dashboardService.getUserStats(userId));
    }
}