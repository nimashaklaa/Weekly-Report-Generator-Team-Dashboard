package com.example.backend.dashboard.controller;

import com.example.backend.dashboard.dto.DashboardSummaryResponse;
import com.example.backend.dashboard.dto.TeamReportStatsResponse;
import com.example.backend.dashboard.dto.UserStatsResponse;
import com.example.backend.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/users/{userId}/stats")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<UserStatsResponse> getUserStats(@PathVariable Integer userId) {
        return ResponseEntity.ok(dashboardService.getUserStats(userId));
    }
}
