package com.example.backend.project.service;

import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.project.dto.ProjectRequest;
import com.example.backend.project.dto.ProjectResponse;
import com.example.backend.project.dto.UpdateProjectRequest;
import com.example.backend.project.model.Project;
import com.example.backend.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        if (projectRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalStateException("A project with this name already exists");
        }
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .colorHex(request.getColorHex())
                .isActive(true)
                .build();
        return ProjectResponse.from(projectRepository.save(project));
    }

    public Page<ProjectResponse> getAllProjects(Boolean activeOnly, Pageable pageable) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return projectRepository.findAllByIsActive(true, pageable).map(ProjectResponse::from);
        }
        return projectRepository.findAll(pageable).map(ProjectResponse::from);
    }

    public List<ProjectResponse> getActiveProjects() {
        return projectRepository.findByIsActiveTrue().stream()
                .map(ProjectResponse::from)
                .toList();
    }

    public ProjectResponse getProjectById(Integer id) {
        return projectRepository.findById(id)
                .map(ProjectResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    @Transactional
    public ProjectResponse updateProject(Integer id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (request.getName() != null) {
            if (projectRepository.existsByNameAndIdNot(request.getName(), id)) {
                throw new IllegalStateException("A project with this name already exists");
            }
            project.setName(request.getName());
        }
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getColorHex() != null) project.setColorHex(request.getColorHex());

        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public void deactivateProject(Integer id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        if (!project.isActive()) {
            throw new IllegalStateException("Project is already inactive");
        }
        project.setActive(false);
        projectRepository.save(project);
    }
}
