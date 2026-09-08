package com.example.backend.team.controller;

import com.example.backend.team.dto.CreateTeamRequest;
import com.example.backend.team.dto.TeamResponse;
import com.example.backend.team.dto.UpdateMembersRequest;
import com.example.backend.team.dto.UpdateProjectMembersRequest;
import com.example.backend.team.dto.UpdateTeamRequest;
import com.example.backend.team.service.TeamService;
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

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
@Tag(name = "Teams")
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<TeamResponse> createTeam(@RequestBody @Valid CreateTeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(request));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<TeamResponse>> getAllTeams(
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) Integer managerId,
            @PageableDefault(size = 20, sort = "name") Pageable pageable,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(teamService.getAllTeams(activeOnly, managerId, pageable, currentUser));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TeamResponse> getTeamById(@PathVariable Integer id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable Integer id,
            @RequestBody @Valid UpdateTeamRequest request
    ) {
        return ResponseEntity.ok(teamService.updateTeam(id, request));
    }

    @PatchMapping("/{id}/members")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<TeamResponse> updateMembers(
            @PathVariable Integer id,
            @RequestBody @Valid UpdateMembersRequest request
    ) {
        return ResponseEntity.ok(teamService.updateMembers(id, request));
    }

    @PostMapping("/{id}/projects/{projectId}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<TeamResponse> addProject(
            @PathVariable Integer id,
            @PathVariable Integer projectId
    ) {
        return ResponseEntity.ok(teamService.addProject(id, projectId));
    }

    @DeleteMapping("/{id}/projects/{projectId}")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<TeamResponse> removeProject(
            @PathVariable Integer id,
            @PathVariable Integer projectId
    ) {
        return ResponseEntity.ok(teamService.removeProject(id, projectId));
    }

    @PutMapping("/{id}/projects/{projectId}/members")
    @PreAuthorize("hasAnyAuthority('MANAGER', 'ADMIN')")
    public ResponseEntity<TeamResponse> updateProjectMembers(
            @PathVariable Integer id,
            @PathVariable Integer projectId,
            @RequestBody UpdateProjectMembersRequest request
    ) {
        return ResponseEntity.ok(teamService.updateProjectMembers(id, projectId, request.getMemberIds()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deactivateTeam(@PathVariable Integer id) {
        teamService.deactivateTeam(id);
        return ResponseEntity.noContent().build();
    }
}