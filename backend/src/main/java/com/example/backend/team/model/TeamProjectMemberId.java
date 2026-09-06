package com.example.backend.team.model;

import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TeamProjectMemberId implements Serializable {
    private Integer teamId;
    private Integer projectId;
    private Integer userId;
}
