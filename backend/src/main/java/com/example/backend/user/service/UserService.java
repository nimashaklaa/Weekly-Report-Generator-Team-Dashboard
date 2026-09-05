package com.example.backend.user.service;

import com.example.backend.common.exception.ResourceNotFoundException;
import com.example.backend.department.repository.DepartmentRepository;
import com.example.backend.department.repository.JobTitleRepository;
import com.example.backend.role.Role;
import com.example.backend.role.RoleRepository;
import com.example.backend.user.User;
import com.example.backend.user.dto.AssignRolesRequest;
import com.example.backend.user.dto.UpdateUserRequest;
import com.example.backend.user.dto.UserResponse;
import com.example.backend.user.repository.UserRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;

    @Override
    @NonNull
    public UserDetails loadUserByUsername(@NonNull String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public Page<UserResponse> getAllUsers(String role, Integer departmentId, Pageable pageable) {
        return userRepository.findWithFilters(role, departmentId, pageable)
                .map(UserResponse::from);
    }

    public UserResponse getUserById(Integer id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public UserResponse updateUser(Integer id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

        if (request.getDepartmentId() != null) {
            var department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));
            user.setDepartment(department);
        }

        if (request.getJobTitleId() != null) {
            var jobTitle = jobTitleRepository.findById(request.getJobTitleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job title not found with id: " + request.getJobTitleId()));
            user.setJobTitle(jobTitle);
        }

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse assignRoles(Integer id, AssignRolesRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        List<Role> roles = request.getRoles().stream()
                .map(roleName -> roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName)))
                .toList();

        user.setRoles(roles);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void lockUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        if (user.isAccountLocked()) {
            throw new IllegalStateException("User account is already locked");
        }
        user.setAccountLocked(true);
        userRepository.save(user);
    }

    @Transactional
    public void unlockUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        if (!user.isAccountLocked()) {
            throw new IllegalStateException("User account is not locked");
        }
        user.setAccountLocked(false);
        userRepository.save(user);
    }
}