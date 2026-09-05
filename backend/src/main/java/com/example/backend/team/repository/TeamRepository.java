package com.example.backend.team.repository;

import com.example.backend.team.model.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Integer> {

    Optional<Team> findByName(String name);

    Page<Team> findAllByIsActive(boolean isActive, Pageable pageable);

    @Query("SELECT t FROM Team t WHERE t.manager.id = :managerId")
    Page<Team> findByManagerId(@Param("managerId") Integer managerId, Pageable pageable);

    boolean existsByNameAndIdNot(String name, Integer id);
}