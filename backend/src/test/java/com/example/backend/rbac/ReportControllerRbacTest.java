package com.example.backend.rbac;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests that verify HTTP-level RBAC enforced by {@code @PreAuthorize}
 * on Report and Team controllers.
 *
 * <p>Test users are seeded by {@code DataSeeder} on context start:
 * <ul>
 *   <li>{@code alice@company.com}  — TEAM_MEMBER</li>
 *   <li>{@code bob@company.com}    — MANAGER</li>
 *   <li>{@code admin@company.com}  — ADMIN</li>
 * </ul>
 *
 * <p>The H2 in-memory database is used (configured in test/resources/application.properties).
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("RBAC — HTTP endpoint access control")
class ReportControllerRbacTest {

    @Autowired
    private MockMvc mockMvc;

    // ═════════════════════════════════════════════════════════════════════════
    // GET /reports  — MANAGER / ADMIN only
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("GET /reports (manager/admin only)")
    class GetAllReports {

        @Test
        @WithAnonymousUser
        @DisplayName("unauthenticated → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(get("/reports"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithUserDetails("alice@company.com")
        @DisplayName("TEAM_MEMBER → 403")
        void teamMember_returns403() throws Exception {
            mockMvc.perform(get("/reports"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithUserDetails("bob@company.com")
        @DisplayName("MANAGER → 200")
        void manager_returns200() throws Exception {
            mockMvc.perform(get("/reports"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithUserDetails("admin@company.com")
        @DisplayName("ADMIN → 200")
        void admin_returns200() throws Exception {
            mockMvc.perform(get("/reports"))
                    .andExpect(status().isOk());
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GET /reports/my  — any authenticated user
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("GET /reports/my (any authenticated user)")
    class GetMyReports {

        @Test
        @WithAnonymousUser
        @DisplayName("unauthenticated → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(get("/reports/my"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithUserDetails("alice@company.com")
        @DisplayName("TEAM_MEMBER → 200")
        void teamMember_returns200() throws Exception {
            mockMvc.perform(get("/reports/my"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithUserDetails("bob@company.com")
        @DisplayName("MANAGER → 200")
        void manager_returns200() throws Exception {
            mockMvc.perform(get("/reports/my"))
                    .andExpect(status().isOk());
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // POST /reports/{id}/approve  — MANAGER / ADMIN only
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("POST /reports/{id}/approve (manager/admin only)")
    class ApproveReport {

        @Test
        @WithAnonymousUser
        @DisplayName("unauthenticated → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(post("/reports/99999/approve"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithUserDetails("alice@company.com")
        @DisplayName("TEAM_MEMBER → 403 (RBAC rejection before service call)")
        void teamMember_returns403() throws Exception {
            mockMvc.perform(post("/reports/99999/approve"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithUserDetails("bob@company.com")
        @DisplayName("MANAGER passes RBAC → 404 for non-existent report (not 403)")
        void manager_passesRbac() throws Exception {
            // 99999 does not exist — service returns 404, but RBAC passed (not 403)
            mockMvc.perform(post("/reports/99999/approve"))
                    .andExpect(status().isNotFound());
        }

        @Test
        @WithUserDetails("admin@company.com")
        @DisplayName("ADMIN passes RBAC → 404 for non-existent report (not 403)")
        void admin_passesRbac() throws Exception {
            mockMvc.perform(post("/reports/99999/approve"))
                    .andExpect(status().isNotFound());
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // POST /reports/{id}/request-correction  — MANAGER / ADMIN only
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("POST /reports/{id}/request-correction (manager/admin only)")
    class RequestCorrection {

        private static final String BODY =
                "{\"body\": \"Please add more detail to the blockers section.\"}";

        @Test
        @WithUserDetails("alice@company.com")
        @DisplayName("TEAM_MEMBER → 403")
        void teamMember_returns403() throws Exception {
            mockMvc.perform(post("/reports/99999/request-correction")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(BODY))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithUserDetails("bob@company.com")
        @DisplayName("MANAGER passes RBAC → 404 for non-existent report")
        void manager_passesRbac() throws Exception {
            mockMvc.perform(post("/reports/99999/request-correction")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(BODY))
                    .andExpect(status().isNotFound());
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // POST /reports/{id}/comments  — MANAGER / ADMIN only
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("POST /reports/{id}/comments (manager/admin only)")
    class AddComment {

        private static final String BODY = "{\"body\": \"Good progress this week.\"}";

        @Test
        @WithUserDetails("alice@company.com")
        @DisplayName("TEAM_MEMBER → 403")
        void teamMember_returns403() throws Exception {
            mockMvc.perform(post("/reports/99999/comments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(BODY))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithUserDetails("bob@company.com")
        @DisplayName("MANAGER passes RBAC → 404 for non-existent report")
        void manager_passesRbac() throws Exception {
            mockMvc.perform(post("/reports/99999/comments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(BODY))
                    .andExpect(status().isNotFound());
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // POST /teams  — MANAGER / ADMIN only
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("POST /teams (manager/admin only)")
    class CreateTeam {

        private static final String VALID_BODY =
                "{\"name\": \"Test Team\", \"managerId\": 1, \"memberIds\": []}";

        @Test
        @WithAnonymousUser
        @DisplayName("unauthenticated → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(post("/teams")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithUserDetails("alice@company.com")
        @DisplayName("TEAM_MEMBER → 403")
        void teamMember_returns403() throws Exception {
            mockMvc.perform(post("/teams")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithUserDetails("bob@company.com")
        @DisplayName("MANAGER passes RBAC (gets past 403)")
        void manager_passesRbac() throws Exception {
            // MANAGER passes the @PreAuthorize check — result may be 201 or 4xx due to
            // data validation, but it must NOT be 403.
            int status = mockMvc.perform(post("/teams")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(VALID_BODY))
                    .andReturn().getResponse().getStatus();
            org.assertj.core.api.Assertions.assertThat(status).isNotEqualTo(403);
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // DELETE /teams/{id}  — ADMIN only
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("DELETE /teams/{id} (admin only)")
    class DeactivateTeam {

        @Test
        @WithUserDetails("alice@company.com")
        @DisplayName("TEAM_MEMBER → 403")
        void teamMember_returns403() throws Exception {
            mockMvc.perform(delete("/teams/99999"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithUserDetails("bob@company.com")
        @DisplayName("MANAGER → 403 (admin-only endpoint)")
        void manager_returns403() throws Exception {
            mockMvc.perform(delete("/teams/99999"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithUserDetails("admin@company.com")
        @DisplayName("ADMIN passes RBAC → 404 for non-existent team")
        void admin_passesRbac() throws Exception {
            mockMvc.perform(delete("/teams/99999"))
                    .andExpect(status().isNotFound());
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // GET /teams  — any authenticated user (role-scoped results)
    // ═════════════════════════════════════════════════════════════════════════

    @Nested
    @DisplayName("GET /teams (authenticated, role-scoped results)")
    class GetTeams {

        @Test
        @WithAnonymousUser
        @DisplayName("unauthenticated → 401")
        void unauthenticated_returns401() throws Exception {
            mockMvc.perform(get("/teams"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithUserDetails("alice@company.com")
        @DisplayName("TEAM_MEMBER → 200 (sees only their member teams)")
        void teamMember_returns200() throws Exception {
            mockMvc.perform(get("/teams"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithUserDetails("bob@company.com")
        @DisplayName("MANAGER → 200 (sees only their managed teams)")
        void manager_returns200() throws Exception {
            mockMvc.perform(get("/teams"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithUserDetails("admin@company.com")
        @DisplayName("ADMIN → 200 (sees all teams)")
        void admin_returns200() throws Exception {
            mockMvc.perform(get("/teams"))
                    .andExpect(status().isOk());
        }
    }
}
