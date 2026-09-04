package com.example.backend.auth.dto;

import com.example.backend.user.dto.UserResponse;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthenticationResponse {
    private String accessToken;
    private UserResponse user;
}
