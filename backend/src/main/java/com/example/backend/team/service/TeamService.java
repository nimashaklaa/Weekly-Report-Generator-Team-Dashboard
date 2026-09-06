package com.example.backend.team.service;

import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.project.model.Project;
import com.example.backend.project.repository.ProjectRepository;
import com.example.backend.team.dto.CreateTeamRequest;
import com.example.backend.team.dto.TeamProjectDetail;
import com.example.backend.team.dto.TeamResponse;
import com.example.backend.team.dto.UpdateMembersRequest;
import com.example.backend.team.dto.UpdateTeamRequest;
import com.example.backend.team.model.Team;
import com.example.backend.team.model.TeamProjectMember;
import com.example.backend.team.model.TeamProjectMemberId;
import com.example.backend.team.repository.TeamProjectMemberRepository;
import com.example.backend.team.repository.TeamRepository;
import com.example.backend.user.User;
import com.example.backend.user.dto.UserResponse;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TeamProjectMemberRepository teamProjectMemberRepository;

    @Transactional
    public TeamResponse createTeam(CreateTeamRequest request) {
        if (teamRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalStateException("A team with this name already exists");
        }

        User manager = userRepository.findById(request.getManagerId())
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id: " + request.getManagerId()));

        List<User> members = resolveMembers(request.getMemberIds());

        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .manager(manager)
                .members(members)
                .projects(new ArrayList<>())
                .isActive(true)
                .build();

        return TeamResponse.from(teamRepository.save(team));
    }

    public Page<TeamResponse> getAllTeams(Boolean activeOnly, Integer managerId, Pageable pageable) {
        if (managerId != null) {
            return teamRepository.findByManagerId(managerId, pageable).map(TeamResponse::from);
        }
        if (Boolean.TRUE.equals(activeOnly)) {
            return teamRepository.findAllByIsActive(true, pageable).map(TeamResponse::from);
        }
        return teamRepository.findAll(pageable).map(TeamResponse::from);
    }

    public TeamResponse getTeamById(Integer id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
        List<TeamProjectDetail> projects = buildProjectDetails(team);
        return TeamResponse.from(team, projects);
    }

    @Transactional
    public TeamResponse updateTeam(Integer id, UpdateTeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        if (request.getName() != null) {
            if (teamRepository.existsByNameAndIdNot(request.getName(), id)) {
                throw new IllegalStateException("A team with this name already exists");
            }
            team.setName(request.getName());
        }

        if (request.getDescription() != null) {
            team.setDescription(request.getDescription());
        }

        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id: " + request.getManagerId()));
            team.setManager(manager);
        }

        return TeamResponse.from(teamRepository.save(team), buildProjectDetails(team));
    }

    @Transactional
    public TeamResponse updateMembers(Integer id, UpdateMembersRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        team.setMembers(resolveMembers(request.getMemberIds()));
        return TeamResponse.from(teamRepository.save(team), buildProjectDetails(team));
    }

    @Transactional
    public TeamResponse addProject(Integer teamId, Integer projectId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        if (team.getProjects() == null) {
            team.setProjects(new ArrayList<>());
        }
        boolean alreadyAssigned = team.getProjects().stream()
                .anyMatch(p -> p.getId().equals(projectId));
        if (!alreadyAssigned) {
            team.getProjects().add(project);
            teamRepository.save(team);
        }
        return TeamResponse.from(team, buildProjectDetails(team));
    }

    @Transactional
    public TeamResponse removeProject(Integer teamId, Integer projectId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        if (team.getProjects() != null) {
            team.getProjects().removeIf(p -> p.getId().equals(projectId));
            teamRepository.save(team);
        }
        teamProjectMemberRepository.deleteByTeamIdAndProjectId(teamId, projectId);
        return TeamResponse.from(team, buildProjectDetails(team));
    }

    @Transactional
    public TeamResponse updateProjectMembers(Integer teamId, Integer projectId, List<Integer> memberIds) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        boolean projectAssigned = team.getProjects() != null &&
                team.getProjects().stream().anyMatch(p -> p.getId().equals(projectId));
        if (!projectAssigned) {
            throw new IllegalStateException("Project " + projectId + " is not assigned to team " + teamId);
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        teamProjectMemberRepository.deleteByTeamIdAndProjectId(teamId, projectId);

        if (memberIds != null && !memberIds.isEmpty()) {
            List<User> members = userRepository.findAllById(memberIds);
            List<TeamProjectMember> entries = members.stream()
                    .map(u -> TeamProjectMember.builder()
                            .id(new TeamProjectMemberId(teamId, projectId, u.getId()))
                            .team(team)
                            .project(project)
                            .user(u)
                            .build())
                    .toList();
            teamProjectMemberRepository.saveAll(entries);
        }

        return TeamResponse.from(team, buildProjectDetails(team));
    }

    @Transactional
    public void deactivateTeam(Integer id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
        if (!team.isActive()) {
            throw new IllegalStateException("Team is already inactive");
        }
        team.setActive(false);
        teamRepository.save(team);
    }

    private List<TeamProjectDetail> buildProjectDetails(Team team) {
        if (team.getProjects() == null || team.getProjects().isEmpty()) {
            return List.of();
        }
        return team.getProjects().stream().map(project -> {
            List<TeamProjectMember> tpms = teamProjectMemberRepository
                    .findByIdTeamIdAndIdProjectId(team.getId(), project.getId());
            List<UserResponse> allowedMembers = tpms.stream()
                    .map(tpm -> UserResponse.from(tpm.getUser()))
                    .toList();
            return TeamProjectDetail.builder()
                    .projectId(project.getId())
                    .projectName(project.getName())
                    .colorHex(project.getColorHex())
                    .allowedMembers(allowedMembers)
                    .build();
        }).toList();
    }

    private List<User> resolveMembers(List<Integer> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return new ArrayList<>();
        }
        List<User> members = userRepository.findAllById(memberIds);
        if (members.size() != memberIds.size()) {
            throw new ResourceNotFoundException("One or more member IDs were not found");
        }
        return members;
    }
}
