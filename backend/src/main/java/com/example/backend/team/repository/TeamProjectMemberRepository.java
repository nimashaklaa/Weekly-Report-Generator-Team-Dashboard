package com.example.backend.team.repository;

import com.example.backend.team.model.TeamProjectMember;
import com.example.backend.team.model.TeamProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TeamProjectMemberRepository extends JpaRepository<TeamProjectMember, TeamProjectMemberId> {

    List<TeamProjectMember> findByIdTeamIdAndIdProjectId(Integer teamId, Integer projectId);

    @Modifying
    @Query("DELETE FROM TeamProjectMember tpm WHERE tpm.id.teamId = :teamId AND tpm.id.projectId = :projectId")
    void deleteByTeamIdAndProjectId(Integer teamId, Integer projectId);

    @Modifying
    @Query("DELETE FROM TeamProjectMember tpm WHERE tpm.id.teamId = :teamId")
    void deleteByTeamId(Integer teamId);
}
