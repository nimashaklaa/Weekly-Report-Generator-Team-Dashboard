package com.example.backend.user.repository;

import com.example.backend.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE " +
           "(:role IS NULL OR r.name = :role) AND " +
           "(:departmentId IS NULL OR u.department.id = :departmentId)")
    Page<User> findWithFilters(
            @Param("role") String role,
            @Param("departmentId") Integer departmentId,
            Pageable pageable);
}
