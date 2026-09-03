package com.example.backend;

import com.example.backend.role.Role;
import com.example.backend.role.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class     BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	@Order(1)
	CommandLineRunner seedRoles(RoleRepository roleRepository) {
		return args -> {
			for (String name : java.util.List.of("TEAM_MEMBER", "MANAGER", "ADMIN")) {
				if (roleRepository.findByName(name).isEmpty()) {
					roleRepository.save(Role.builder().name(name).build());
				}
			}
		};
	}

}
