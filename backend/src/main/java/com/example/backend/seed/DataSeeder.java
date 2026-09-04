package com.example.backend.seed;

import com.example.backend.department.model.Department;
import com.example.backend.department.model.JobLevel;
import com.example.backend.department.model.JobTitle;
import com.example.backend.department.repository.DepartmentRepository;
import com.example.backend.department.repository.JobTitleRepository;
import com.example.backend.role.Role;
import com.example.backend.role.RoleRepository;
import com.example.backend.team.model.Team;
import com.example.backend.team.repository.TeamRepository;
import com.example.backend.user.User;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Order(2)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final JobTitleRepository jobTitleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TeamRepository teamRepository;

    private static final String SEED_PASSWORD = "SeedPass1!";

    @Override
    public void run(String... args) {
        seedDepartments();
        seedJobTitles();
        seedUsers();
        seedTeam();
    }

    private void seedDepartments() {
        List<String> departments = List.of(
                "Engineering",
                "Product",
                "Design",
                "Marketing",
                "Operations",
                "Human Resources"
        );
        for (String name : departments) {
            if (departmentRepository.findByName(name).isEmpty()) {
                departmentRepository.save(Department.builder()
                        .name(name)
                        .isActive(true)
                        .build());
            }
        }
    }

    private void seedJobTitles() {
        Map<String, Object[]> titles = Map.of(
                "Software Engineer",        new Object[]{"Engineering", JobLevel.MID},
                "Senior Software Engineer", new Object[]{"Engineering", JobLevel.SENIOR},
                "Engineering Lead",         new Object[]{"Engineering", JobLevel.LEAD},
                "Product Manager",          new Object[]{"Product", JobLevel.MANAGER},
                "UI/UX Designer",           new Object[]{"Design", JobLevel.MID},
                "Senior Designer",          new Object[]{"Design", JobLevel.SENIOR},
                "HR Specialist",            new Object[]{"Human Resources", JobLevel.MID},
                "Marketing Specialist",     new Object[]{"Marketing", JobLevel.MID}
        );

        titles.forEach((title, meta) -> {
            if (jobTitleRepository.findByTitle(title).isEmpty()) {
                String deptName = (String) meta[0];
                JobLevel level = (JobLevel) meta[1];
                departmentRepository.findByName(deptName).ifPresent(dept ->
                        jobTitleRepository.save(JobTitle.builder()
                                .title(title)
                                .level(level)
                                .department(dept)
                                .isActive(true)
                                .build())
                );
            }
        });
    }

    private void seedUsers() {
        Role adminRole   = roleRepository.findByName("ADMIN").orElseThrow();
        Role managerRole = roleRepository.findByName("MANAGER").orElseThrow();
        Role memberRole  = roleRepository.findByName("TEAM_MEMBER").orElseThrow();

        Department engineeringDept = departmentRepository.findByName("Engineering").orElse(null);
        JobTitle softwareEngineer  = jobTitleRepository.findByTitle("Software Engineer").orElse(null);
        JobTitle seniorEngineer    = jobTitleRepository.findByTitle("Senior Software Engineer").orElse(null);
        JobTitle engLead           = jobTitleRepository.findByTitle("Engineering Lead").orElse(null);

        createUserIfAbsent("admin@company.com",   "Admin",   "User",    List.of(adminRole),   null,            null);
        createUserIfAbsent("bob@company.com",     "Bob",     "Chen",    List.of(managerRole), engineeringDept, engLead);
        createUserIfAbsent("alice@company.com",   "Alice",   "Kim",     List.of(memberRole),  engineeringDept, seniorEngineer);
        createUserIfAbsent("charlie@company.com", "Charlie", "Tran",    List.of(memberRole),  engineeringDept, softwareEngineer);
        createUserIfAbsent("diana@company.com",   "Diana",   "Patel",   List.of(memberRole),  engineeringDept, softwareEngineer);
        createUserIfAbsent("evan@company.com",    "Evan",    "Brooks",  List.of(memberRole),  engineeringDept, softwareEngineer);
    }

    private void createUserIfAbsent(String email, String firstName, String lastName,
                                    List<Role> roles, Department dept, JobTitle jobTitle) {
        if (userRepository.findByEmail(email).isPresent()) return;
        userRepository.save(User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(passwordEncoder.encode(SEED_PASSWORD))
                .accountLocked(false)
                .enabled(true)
                .roles(roles)
                .department(dept)
                .jobTitle(jobTitle)
                .build());
    }

    private void seedTeam() {
        if (teamRepository.findByName("Platform Engineering").isPresent()) return;

        var bob     = userRepository.findByEmail("bob@company.com").orElseThrow();
        var alice   = userRepository.findByEmail("alice@company.com").orElseThrow();
        var charlie = userRepository.findByEmail("charlie@company.com").orElseThrow();
        var diana   = userRepository.findByEmail("diana@company.com").orElseThrow();
        var evan    = userRepository.findByEmail("evan@company.com").orElseThrow();

        teamRepository.save(Team.builder()
                .name("Platform Engineering")
                .description("Core platform and infrastructure team")
                .manager(bob)
                .members(List.of(alice, charlie, diana, evan))
                .isActive(true)
                .build());
    }
}
