package com.example.backend.team.service;

import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.team.dto.CreateTeamRequest;
import com.example.backend.team.dto.TeamResponse;
import com.example.backend.team.dto.UpdateMembersRequest;
import com.example.backend.team.dto.UpdateTeamRequest;
import com.example.backend.team.model.Team;
import com.example.backend.team.repository.TeamRepository;
import com.example.backend.user.User;
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
                .isActive(true)
                .build();

        return TeamResponse.from(teamRepository.save(team));
    }

    public Page<TeamResponse> getAllTeams(Boolean activeOnly, Pageable pageable) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return teamRepository.findAllByIsActive(true, pageable).map(TeamResponse::from);
        }
        return teamRepository.findAll(pageable).map(TeamResponse::from);
    }

    public TeamResponse getTeamById(Integer id) {
        return teamRepository.findById(id)
                .map(TeamResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
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

        return TeamResponse.from(teamRepository.save(team));
    }

    @Transactional
    public TeamResponse updateMembers(Integer id, UpdateMembersRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        team.setMembers(resolveMembers(request.getMemberIds()));
        return TeamResponse.from(teamRepository.save(team));
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