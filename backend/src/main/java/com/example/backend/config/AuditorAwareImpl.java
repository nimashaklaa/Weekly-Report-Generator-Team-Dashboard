package com.example.backend.config;

import com.example.backend.user.User;
import lombok.NonNull;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("auditorAware")
public class AuditorAwareImpl implements AuditorAware<Integer> {

    @Override
    @NonNull
    public Optional<Integer> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return Optional.of(0); // system/seed operations
        }
        User user = (User) authentication.getPrincipal();
        return Optional.ofNullable(user.getId()).or(() -> Optional.of(0));
    }
}