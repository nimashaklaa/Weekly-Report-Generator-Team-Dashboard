package com.example.backend.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class TeamTaskStatsResponse {
    private List<NamedHours> byProject;
    private List<NamedHours> byCategory;

    @Getter
    @Builder
    public static class NamedHours {
        private String name;
        private double hours;
    }
}