package com.example.backend.auth.service;

import com.example.backend.auth.Token;
import com.example.backend.auth.TokenRepository;
import com.example.backend.auth.TokenType;
import com.example.backend.auth.dto.AuthenticationRequest;
import com.example.backend.auth.dto.AuthenticationResponse;
import com.example.backend.auth.dto.RegistrationRequest;
import com.example.backend.department.repository.DepartmentRepository;
import com.example.backend.department.repository.JobTitleRepository;
import com.example.backend.email.EmailService;
import com.example.backend.email.EmailTemplateName;
import com.example.backend.role.RoleRepository;
import com.example.backend.security.JwtService;
import com.example.backend.user.User;
import com.example.backend.user.dto.UserResponse;
import com.example.backend.user.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;

    @Value("${application.security.mailing.frontend.activation-url}")
    private String activationUrl;

    public void register(@Valid RegistrationRequest request) throws MessagingException {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already registered");
        }
        var userRole = roleRepository.findByName("TEAM_MEMBER").orElseThrow(
                ()-> new IllegalStateException("TEAM_MEMBER ROLE was not initialized")
        );
        var department = request.getDepartmentId() != null
                ? departmentRepository.findById(request.getDepartmentId()).orElse(null)
                : null;
        var jobTitle = request.getJobTitleId() != null
                ? jobTitleRepository.findById(request.getJobTitleId()).orElse(null)
                : null;

        var user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .accountLocked(false)
                .enabled(false)
                .roles(List.of(userRole))
                .department(department)
                .jobTitle(jobTitle)
                .build();
        userRepository.save(user);
        sendValidationEmail(user);
    }

    private void sendValidationEmail(User user) throws MessagingException {
        var newToken = generateAndSaveActivationToken(user);

        emailService.sendEmail(
                user.getEmail(),
                user.fullName(),
                EmailTemplateName.ACTIVATE_ACCOUNT,
                activationUrl,
                newToken,
                "Account activation"
        );


    }

    private String generateAndSaveActivationToken(User user) {
        String generatedToken = generateActivationCode();
        var token = Token.builder()
                .token(generatedToken)
                .tokenType(TokenType.BEARER)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .user(user)
                .build();
        tokenRepository.save(token);
        return generatedToken;
    }

    private String generateActivationCode() {
        String characters = "0123456789";
        StringBuilder codeBuilder = new StringBuilder();
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < 6; i++) {
            codeBuilder.append(characters.charAt(random.nextInt(characters.length())));
        }
        return codeBuilder.toString();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var auth = authenticationManager.authenticate(
                //You are taking raw, untrusted user inputs (email and password) and asking Spring Security to verify them.
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = ((User) auth.getPrincipal());
        var claims = new HashMap<String, Object>();
        claims.put("fullname", user.fullName());
        var jwtToken = jwtService.generateToken(claims, user);
        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .user(UserResponse.from(user))
                .build();
    }


    public void activateAccount(String token) throws MessagingException {
        Token savedToke = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token not found"));
        if(LocalDateTime.now().isAfter(savedToke.getExpiresAt())){
            sendValidationEmail(savedToke.getUser());
            throw new RuntimeException("Token has expired");
        }
        var user = userRepository.findById(savedToke.getUser().getId()).orElseThrow(()-> new UsernameNotFoundException("User not found"));
        user.setEnabled(true);
        userRepository.save(user);
        savedToke.setValidatedAt(LocalDateTime.now());
        tokenRepository.save(savedToke);
    }
}
