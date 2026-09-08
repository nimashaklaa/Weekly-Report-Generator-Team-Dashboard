package com.example.backend.seed;

import com.example.backend.report.enums.MoodType;
import com.example.backend.report.enums.ReportStatus;
import com.example.backend.report.enums.TaskPriority;
import com.example.backend.report.enums.TaskStatus;
import com.example.backend.report.model.ReportComment;
import com.example.backend.report.model.ReportHoursBreakdown;
import com.example.backend.report.model.ReportTask;
import com.example.backend.report.model.WeeklyReport;
import com.example.backend.report.repository.ReportCommentRepository;
import com.example.backend.report.repository.ReportHoursBreakdownRepository;
import com.example.backend.report.repository.ReportTaskRepository;
import com.example.backend.report.repository.WeeklyReportRepository;
import com.example.backend.team.model.Team;
import com.example.backend.team.repository.TeamRepository;
import com.example.backend.user.User;
import com.example.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@Order(3)
@RequiredArgsConstructor
public class ReportSeeder implements CommandLineRunner {

    private final UserRepository               userRepository;
    private final TeamRepository               teamRepository;
    private final WeeklyReportRepository       reportRepository;
    private final ReportTaskRepository         taskRepository;
    private final ReportHoursBreakdownRepository breakdownRepository;
    private final ReportCommentRepository      commentRepository;

    // ── Helpers ────────────────────────────────────────────────────────────────

    private static BigDecimal bd(double v)      { return BigDecimal.valueOf(v); }
    private static LocalDateTime ldt(String s)  { return LocalDateTime.parse(s); }

    private record TaskDef(String title, TaskStatus status, TaskPriority priority, BigDecimal hours) {}

    // ── Entry point ────────────────────────────────────────────────────────────

    @Override
    public void run(String... args) {
        if (reportRepository.count() > 0) return;

        User bob     = userRepository.findByEmail("bob@company.com").orElseThrow();
        User alice   = userRepository.findByEmail("alice@company.com").orElseThrow();
        User charlie = userRepository.findByEmail("charlie@company.com").orElseThrow();
        User diana   = userRepository.findByEmail("diana@company.com").orElseThrow();
        User evan    = userRepository.findByEmail("evan@company.com").orElseThrow();

        Team team = teamRepository.findByName("Platform Engineering").orElseThrow();

        seedAlice(alice, bob, team);
        seedCharlie(charlie, bob, team);
        seedDiana(diana, bob, team);
        seedEvan(evan, bob, team);
    }

    // ── Alice Kim ──────────────────────────────────────────────────────────────

    private void seedAlice(User alice, User bob, Team team) {

        // W32 — APPROVED
        save(alice, bob, team, 2026, 32, ReportStatus.APPROVED, MoodType.GREAT,
            "Productive week focused on API gateway improvements. Completed rate limiting implementation and wrapped up auth middleware refactoring.",
            "Shipped rate limiting middleware for all public API endpoints, reducing P95 latency by 18%.",
            "API rate limiting — shipped to production",
            "Code review turnaround from the infra team was slower than expected, causing a minor delay.",
            null,
            "Continue auth middleware refactor, begin token refresh flow design.",
            ldt("2026-08-07T16:30"), ldt("2026-08-10T09:30"),
            new TaskDef[]{
                new TaskDef("Implement API rate limiting middleware",   TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(12)),
                new TaskDef("Auth middleware refactor — phase 1",       TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Write unit tests for rate limiter",         TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(4)),
                new TaskDef("Update API docs with rate-limit headers",   TaskStatus.COMPLETED, TaskPriority.LOW,    bd(2)),
            },
            bd(4), bd(18), bd(2), bd(4), bd(2));

        // W33 — APPROVED
        save(alice, bob, team, 2026, 33, ReportStatus.APPROVED, MoodType.GREAT,
            "Completed token refresh flow and started JWT rotation work. Team knowledge share on security best practices was well received.",
            "Token refresh flow is live — eliminated 95% of forced re-logins during long sessions.",
            "Token refresh flow — live in production",
            null,
            null,
            "JWT rotation implementation, performance profiling of auth endpoints.",
            ldt("2026-08-14T17:00"), ldt("2026-08-17T10:00"),
            new TaskDef[]{
                new TaskDef("Implement token refresh endpoint",          TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(10)),
                new TaskDef("JWT rotation logic",                        TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Security knowledge share — prepare slides", TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(3)),
                new TaskDef("Auth endpoint performance profiling",        TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, bd(5)),
            },
            bd(5), bd(18), bd(2), bd(4), bd(1));

        // W34 — APPROVED
        save(alice, bob, team, 2026, 34, ReportStatus.APPROVED, MoodType.GOOD,
            "Finished auth endpoint profiling — found two N+1 queries and patched them. Started design doc for the new notifications service.",
            "Resolved N+1 queries in auth flow, cutting DB load by 30% during peak hours.",
            "Auth N+1 query fix — 30% DB load reduction",
            null,
            null,
            "Notifications service design doc review, begin implementation of notification fanout logic.",
            ldt("2026-08-21T16:00"), ldt("2026-08-24T11:00"),
            new TaskDef[]{
                new TaskDef("Auth profiling — identify and fix N+1 queries", TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Notifications service design doc",               TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("PR reviews for team",                            TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(4)),
                new TaskDef("Update runbooks for auth service",               TaskStatus.COMPLETED, TaskPriority.LOW,    bd(2)),
            },
            bd(4), bd(14), bd(2), bd(4), bd(2));

        // W35 — APPROVED
        save(alice, bob, team, 2026, 35, ReportStatus.APPROVED, MoodType.GOOD,
            "Built out notification fanout logic and wrote integration tests. Helped Charlie debug the migration scripts.",
            "Notification fanout fully tested — 3 notification types live (email, in-app, push stub).",
            "Notifications fanout — 3 channels live",
            "Integration test suite is slow (~4 min); need to look into parallelisation.",
            null,
            "Parallelise integration tests, begin dashboard API endpoints.",
            ldt("2026-08-28T17:30"), ldt("2026-08-31T09:00"),
            new TaskDef[]{
                new TaskDef("Notification fanout — email + in-app channels", TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(10)),
                new TaskDef("Integration tests for notifications",            TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Help Charlie debug migration scripts",           TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(3)),
                new TaskDef("PR reviews",                                     TaskStatus.COMPLETED, TaskPriority.LOW,    bd(2)),
            },
            bd(4), bd(16), bd(2), bd(3), bd(2));

        // W36 — SUBMITTED
        save(alice, bob, team, 2026, 36, ReportStatus.SUBMITTED, MoodType.GOOD,
            "Dashboard API endpoints are taking shape — GET /dashboard/summary and team stats endpoints done. Working on user-level stats aggregation.",
            "Dashboard summary and team stats APIs complete with caching layer.",
            "Dashboard API — summary + team stats endpoints done",
            "User stats aggregation query is complex; hitting performance issues on large datasets.",
            "Slow aggregation query for user stats — needs index tuning.",
            "Finish user stats endpoint with optimised query, add caching, write docs.",
            ldt("2026-09-05T17:00"), null,
            new TaskDef[]{
                new TaskDef("GET /dashboard/summary endpoint",     TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(8)),
                new TaskDef("Team report stats API",               TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(8)),
                new TaskDef("User stats aggregation endpoint",     TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Add Redis caching layer for dashboard", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, bd(4)),
            },
            bd(5), bd(18), bd(2), bd(4), bd(1));

        // W37 — DRAFT (current week, partial)
        save(alice, null, team, 2026, 37, ReportStatus.DRAFT, null,
            "Working on user stats query optimisation and finishing up the caching layer.",
            null,
            null,
            null,
            null,
            null,
            null, null,
            new TaskDef[]{
                new TaskDef("User stats query — add composite index", TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   bd(4)),
                new TaskDef("Redis caching — TTL strategy",           TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, bd(3)),
            },
            bd(2), bd(7), bd(1), bd(2), bd(0));
    }

    // ── Charlie Tran ──────────────────────────────────────────────────────────

    private void seedCharlie(User charlie, User bob, Team team) {

        // W32 — APPROVED
        save(charlie, bob, team, 2026, 32, ReportStatus.APPROVED, MoodType.GOOD,
            "Worked on database schema migrations for the new reporting module. Ran into some FK constraint issues but resolved them by end of week.",
            "Reporting module schema migrations applied to staging — ready for prod next week.",
            "Reporting schema — staging migration complete",
            "FK constraint order in migration scripts caused some friction.",
            null,
            "Apply migrations to production, begin stored procedure work.",
            ldt("2026-08-07T17:00"), ldt("2026-08-10T10:00"),
            new TaskDef[]{
                new TaskDef("Write reporting schema migration scripts",  TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(10)),
                new TaskDef("Fix FK constraint ordering in migrations",  TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Apply migrations to staging",               TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(4)),
                new TaskDef("Write rollback scripts",                    TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(4)),
            },
            bd(3), bd(16), bd(2), bd(3), bd(0));

        // W33 — APPROVED
        save(charlie, bob, team, 2026, 33, ReportStatus.APPROVED, MoodType.NEUTRAL,
            "Production migration went smoothly. Spent most of the week improving our CI/CD pipeline — added parallel test execution and reduced build times.",
            "CI build time cut from 12 min to 4 min with parallel test execution.",
            "CI build time — 12 min → 4 min",
            "Had to debug a race condition in the parallel test setup that caused flaky tests.",
            null,
            "Write missing migration documentation, continue CI improvements.",
            ldt("2026-08-14T16:30"), ldt("2026-08-18T09:00"),
            new TaskDef[]{
                new TaskDef("Apply reporting schema to production",   TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(4)),
                new TaskDef("Add parallel test execution to CI",      TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(8)),
                new TaskDef("Fix flaky tests from parallelisation",   TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(6)),
                new TaskDef("Write migration runbook (incomplete)",   TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, bd(2)),
            },
            bd(3), bd(14), bd(2), bd(4), bd(1));

        // W34 — NEEDS_CORRECTION (correction requested by Bob)
        WeeklyReport charlieW34 = save(charlie, null, team, 2026, 34, ReportStatus.NEEDS_CORRECTION, MoodType.DIFFICULT,
            "Started stored procedure work. Struggled with performance — turns out our query planner isn't using the right index.",
            "Identified index usage issue causing slow reporting queries.",
            null,
            "Index not being picked up by query planner for reporting aggregations — root cause unclear.",
            "Query planner not using idx_report_week for aggregation queries.",
            "Investigate EXPLAIN output, consider FORCE INDEX or query restructure.",
            ldt("2026-08-21T17:30"), null,
            new TaskDef[]{
                new TaskDef("Stored procedure for weekly report aggregation", TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   bd(12)),
                new TaskDef("Investigate slow aggregation query",             TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Write migration runbook",                        TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, bd(4)),
            },
            bd(4), bd(14), bd(2), bd(2), bd(2));

        // Add Bob's correction request comment
        commentRepository.save(ReportComment.builder()
            .report(charlieW34)
            .author(bob)  // reviewer is bob but correction stored as comment author
            .body("The migration runbook is still incomplete after two weeks. Please finalise it before resubmitting — it needs to cover rollback procedures and the FK ordering rationale. Also, provide more detail on the query planner issue: include the EXPLAIN output and what you tried.")
            .isCorrectionRequest(true)
            .versionNumber(1)
            .build());

        // W35 — APPROVED (resubmitted after correction)
        save(charlie, bob, team, 2026, 35, ReportStatus.APPROVED, MoodType.GOOD,
            "Addressed Bob's feedback — migration runbook is complete and the query planner issue is resolved. Turns out we needed to run ANALYZE after the schema change.",
            "Migration runbook finalised. Aggregation query now uses the correct index — reporting queries are 8× faster.",
            "Aggregation query — 8× speedup after ANALYZE + index hint",
            null,
            null,
            "Write stored procedure tests, begin work on report export feature.",
            ldt("2026-08-27T16:00"), ldt("2026-08-31T10:30"),
            new TaskDef[]{
                new TaskDef("Finalise migration runbook with rollback procedures", TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Fix aggregation query — ANALYZE + index hint",        TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Stored procedure — weekly aggregation v2",            TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("PR reviews",                                           TaskStatus.COMPLETED, TaskPriority.LOW,    bd(2)),
            },
            bd(3), bd(16), bd(2), bd(4), bd(1));

        // W36 — SUBMITTED
        save(charlie, bob, team, 2026, 36, ReportStatus.SUBMITTED, MoodType.GOOD,
            "Started report export feature (CSV + PDF). CSV export is done; PDF is in progress using a templating library.",
            "CSV export endpoint live. PDF generation works for basic reports.",
            "Report export — CSV done, PDF in progress",
            "PDF library has issues with tables > 50 rows — looking for workaround.",
            "PDF rendering breaks on large report tables.",
            "Fix PDF pagination, write export tests, add export button to frontend.",
            ldt("2026-09-05T17:30"), null,
            new TaskDef[]{
                new TaskDef("CSV export endpoint",                  TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(8)),
                new TaskDef("PDF export — basic template",          TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   bd(10)),
                new TaskDef("Fix PDF table pagination issue",       TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   bd(4)),
                new TaskDef("Export integration tests",             TaskStatus.NOT_STARTED, TaskPriority.MEDIUM, bd(0)),
            },
            bd(3), bd(16), bd(2), bd(4), bd(1));

        // W37 — DRAFT
        save(charlie, null, team, 2026, 37, ReportStatus.DRAFT, null,
            "Still working on PDF fix.",
            null,
            null,
            null,
            null,
            null,
            null, null,
            new TaskDef[]{
                new TaskDef("Fix PDF table pagination", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, bd(5)),
            },
            bd(1), bd(5), bd(1), bd(1), bd(0));
    }

    // ── Diana Patel ────────────────────────────────────────────────────────────

    private void seedDiana(User diana, User bob, Team team) {

        // W32 — APPROVED
        save(diana, bob, team, 2026, 32, ReportStatus.APPROVED, MoodType.GREAT,
            "Built the first version of the team dashboard UI — KPI cards, status breakdown chart, and the submissions table. Lots of design iteration.",
            "Team Dashboard v1 shipped to staging — KPI cards, bar chart, and submissions table all functional.",
            "Team Dashboard v1 — shipped to staging",
            null,
            null,
            "Polish responsive layout, add team selector for multi-team managers.",
            ldt("2026-08-07T16:00"), ldt("2026-08-10T11:00"),
            new TaskDef[]{
                new TaskDef("Dashboard KPI card components",          TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Status breakdown bar chart (Recharts)",  TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Submissions table with status badges",   TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Responsive layout adjustments",          TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(2)),
            },
            bd(4), bd(18), bd(2), bd(2), bd(0));

        // W33 — APPROVED
        save(diana, bob, team, 2026, 33, ReportStatus.APPROVED, MoodType.GOOD,
            "Added team selector and mood trend charts to the dashboard. Also worked on the personal dashboard — cleaned up the KPI card design.",
            "Mood stacked bar chart live. Team selector works for managers with multiple teams.",
            "Multi-team selector + mood trend chart — done",
            null,
            null,
            "Team insights page with historical charts, member activity table.",
            ldt("2026-08-14T17:00"), ldt("2026-08-18T09:30"),
            new TaskDef[]{
                new TaskDef("Team selector dropdown component",      TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Mood stacked bar chart",                TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Personal dashboard KPI card redesign",  TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(6)),
                new TaskDef("Recharts tooltip customisation",        TaskStatus.COMPLETED, TaskPriority.LOW,    bd(2)),
            },
            bd(4), bd(16), bd(2), bd(4), bd(0));

        // W34 — APPROVED
        save(diana, bob, team, 2026, 34, ReportStatus.APPROVED, MoodType.GREAT,
            "Team Insights page is done — line charts for submissions and avg hours, mood stacked bar, member activity table, recent reports feed.",
            "Team Insights page shipped. Managers now have full historical visibility across all their teams.",
            "Team Insights page — full historical charts done",
            null,
            null,
            "Member profile page, manager review page.",
            ldt("2026-08-21T16:30"), ldt("2026-08-25T09:00"),
            new TaskDef[]{
                new TaskDef("Team Insights — submissions line chart",   TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Team Insights — avg hours line chart",     TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Member activity table with initials avatar", TaskStatus.COMPLETED, TaskPriority.HIGH, bd(6)),
                new TaskDef("Recent reports feed",                       TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(4)),
                new TaskDef("PR reviews + accessibility checks",          TaskStatus.COMPLETED, TaskPriority.LOW,   bd(2)),
            },
            bd(4), bd(18), bd(2), bd(4), bd(0));

        // W35 — SUBMITTED
        save(diana, bob, team, 2026, 35, ReportStatus.SUBMITTED, MoodType.GOOD,
            "Built Member Profile page and Manager Review page. The review page has a much better UX for the approve/request-changes flow.",
            "Member Profile and Manager Review pages complete. Review flow is cleaner — one dedicated page per submitted report.",
            "Manager Review + Member Profile pages — done",
            "Coordinating the route protection logic with the backend role scoping took longer than expected.",
            null,
            "Wire up routing, add entry points from dashboards to member profiles.",
            ldt("2026-08-28T17:30"), null,
            new TaskDef[]{
                new TaskDef("Member Profile page — stats + charts",    TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(10)),
                new TaskDef("Manager Review page — approve/correct flow", TaskStatus.COMPLETED, TaskPriority.HIGH,  bd(8)),
                new TaskDef("Route protection for manager-only pages", TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(4)),
                new TaskDef("Wire entry points from team dashboards",  TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, bd(4)),
            },
            bd(4), bd(18), bd(2), bd(4), bd(0));

        // W36 — SUBMITTED
        save(diana, bob, team, 2026, 36, ReportStatus.SUBMITTED, MoodType.NEUTRAL,
            "Spent the week on testing and bug fixes — report detail page wasn't showing saved fields, hours breakdown had an 'id' label bug, management nav was showing for non-managers.",
            "Fixed three UI bugs: blank report fields, wrong hours breakdown labels, nav visibility scoping.",
            "Three frontend bugs fixed — report detail, hours breakdown, nav scoping",
            "Uncovering these bugs late in the cycle; should set up better E2E test coverage earlier.",
            "No E2E tests — bugs only caught manually.",
            "Set up Playwright E2E test suite, at least for the happy path report flows.",
            ldt("2026-09-05T16:30"), null,
            new TaskDef[]{
                new TaskDef("Fix report detail page — blank fields bug",         TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(4)),
                new TaskDef("Fix hours breakdown 'id' label + total=null bug",   TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(4)),
                new TaskDef("Fix management nav showing for non-managers",        TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(4)),
                new TaskDef("Set up Playwright E2E scaffold",                    TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, bd(4)),
                new TaskDef("Write E2E tests for report submit flow",             TaskStatus.NOT_STARTED, TaskPriority.MEDIUM, bd(0)),
            },
            bd(4), bd(12), bd(2), bd(4), bd(2));
    }

    // ── Evan Brooks ────────────────────────────────────────────────────────────

    private void seedEvan(User evan, User bob, Team team) {

        // W32 — APPROVED
        save(evan, bob, team, 2026, 32, ReportStatus.APPROVED, MoodType.GOOD,
            "Set up the Docker Compose environment for local development and configured the staging Kubernetes cluster.",
            "Local dev environment standardised with Docker Compose — onboarding time should drop significantly.",
            "Docker Compose local dev environment — done",
            null,
            null,
            "Configure production Kubernetes cluster, set up Helm charts.",
            ldt("2026-08-07T17:30"), ldt("2026-08-11T09:00"),
            new TaskDef[]{
                new TaskDef("Docker Compose local dev setup",             TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(10)),
                new TaskDef("Staging Kubernetes cluster configuration",   TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Write developer onboarding guide",           TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(4)),
                new TaskDef("Configure dev/staging DNS records",          TaskStatus.COMPLETED, TaskPriority.LOW,    bd(2)),
            },
            bd(3), bd(18), bd(2), bd(2), bd(1));

        // W33 — APPROVED
        save(evan, bob, team, 2026, 33, ReportStatus.APPROVED, MoodType.GREAT,
            "Production Kubernetes cluster is up. CI/CD pipeline now deploys to staging on every merge to main, and to production on version tags.",
            "Full CI/CD pipeline live — staging auto-deploy on merge, production deploy on tag.",
            "CI/CD pipeline — staging + production deploys automated",
            null,
            null,
            "Set up monitoring with Prometheus + Grafana, define SLO dashboards.",
            ldt("2026-08-14T17:30"), ldt("2026-08-18T10:00"),
            new TaskDef[]{
                new TaskDef("Production Kubernetes cluster setup",    TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Helm charts for backend + frontend",     TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("CI pipeline — staging auto-deploy",      TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("CI pipeline — production tag deploy",    TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(4)),
            },
            bd(3), bd(18), bd(2), bd(4), bd(1));

        // W34 — APPROVED
        save(evan, bob, team, 2026, 34, ReportStatus.APPROVED, MoodType.GOOD,
            "Prometheus and Grafana are running. Created SLO dashboards for API latency and error rate. Set up PagerDuty integration.",
            "Monitoring stack live with SLO dashboards and PagerDuty alerts for P99 latency > 500ms and error rate > 1%.",
            "Monitoring stack live — SLO dashboards + PagerDuty alerts",
            "PagerDuty webhook configuration had some undocumented quirks — took half a day to sort.",
            null,
            "Add log aggregation (Loki), write runbooks for the main alert scenarios.",
            ldt("2026-08-21T17:00"), ldt("2026-08-25T10:00"),
            new TaskDef[]{
                new TaskDef("Prometheus + Grafana deployment",        TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("SLO dashboards — latency + error rate",  TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("PagerDuty integration + alert rules",    TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Write monitoring runbook",               TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(4)),
            },
            bd(3), bd(18), bd(2), bd(4), bd(1));

        // W35 — APPROVED
        save(evan, bob, team, 2026, 35, ReportStatus.APPROVED, MoodType.GREAT,
            "Loki log aggregation is working. Wrote runbooks for the three most common alert scenarios. Started disaster recovery plan.",
            "Loki live — structured logs from all services now searchable in Grafana. Runbooks cover the top 3 alert types.",
            "Loki log aggregation live + alert runbooks done",
            null,
            null,
            "Complete DR plan, run first chaos engineering exercise.",
            ldt("2026-08-28T17:00"), ldt("2026-09-01T09:30"),
            new TaskDef[]{
                new TaskDef("Loki log aggregation setup",             TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Alert runbooks — top 3 scenarios",       TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Disaster recovery plan — draft",         TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(6)),
                new TaskDef("PR reviews",                             TaskStatus.COMPLETED, TaskPriority.LOW,    bd(2)),
            },
            bd(3), bd(16), bd(2), bd(4), bd(1));

        // W36 — APPROVED
        save(evan, bob, team, 2026, 36, ReportStatus.APPROVED, MoodType.GREAT,
            "Disaster recovery plan is finalised. Ran first chaos engineering exercise — injected pod failures and validated our alerts fired within SLO.",
            "DR plan complete. Chaos test passed — all three scenarios detected and alerted within 90s.",
            "Chaos engineering exercise — all scenarios passed",
            null,
            null,
            "Automate weekly chaos tests in CI, set up cost monitoring for cloud spend.",
            ldt("2026-09-05T16:00"), ldt("2026-09-07T09:00"),
            new TaskDef[]{
                new TaskDef("Finalise disaster recovery plan",        TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Chaos engineering — pod failure tests",  TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(8)),
                new TaskDef("Validate alert response times",          TaskStatus.COMPLETED, TaskPriority.HIGH,   bd(4)),
                new TaskDef("Write chaos test report",                TaskStatus.COMPLETED, TaskPriority.MEDIUM, bd(4)),
            },
            bd(4), bd(16), bd(2), bd(4), bd(2));

        // W37 — SUBMITTED
        save(evan, bob, team, 2026, 37, ReportStatus.SUBMITTED, MoodType.GOOD,
            "Started automating weekly chaos tests in CI. Cloud cost monitoring dashboard is live in Grafana using the AWS CloudWatch data source.",
            "Cloud cost Grafana dashboard live — first week we can see per-service spend in real time.",
            "Cloud cost monitoring dashboard — live",
            "AWS CloudWatch data source has a 10-minute delay — not ideal for alerting but fine for dashboards.",
            null,
            "Add cost anomaly alerts, schedule first chaos automation run in CI.",
            ldt("2026-09-08T12:00"), null,
            new TaskDef[]{
                new TaskDef("Automate chaos tests in CI pipeline",          TaskStatus.IN_PROGRESS, TaskPriority.HIGH,   bd(6)),
                new TaskDef("Cloud cost Grafana dashboard",                 TaskStatus.COMPLETED,   TaskPriority.HIGH,   bd(6)),
                new TaskDef("AWS CloudWatch data source configuration",     TaskStatus.COMPLETED,   TaskPriority.MEDIUM, bd(4)),
                new TaskDef("Cost anomaly alert rules",                     TaskStatus.NOT_STARTED, TaskPriority.MEDIUM, bd(0)),
            },
            bd(3), bd(14), bd(2), bd(4), bd(2));
    }

    // ── Core builder ────────────────────────────────────────────────────────────

    /**
     * Creates and persists a WeeklyReport with its tasks and hours breakdown.
     * Returns the saved report (useful when callers need to attach comments).
     */
    private WeeklyReport save(
            User author, User reviewer, Team team,
            int weekYear, int weekNumber,
            ReportStatus status, MoodType mood,
            String summary, String achievements, String keyAchievement,
            String blockers, String keyIssue, String nextWeekPlan,
            LocalDateTime submittedAt, LocalDateTime reviewedAt,
            TaskDef[] tasks,
            BigDecimal meetingH, BigDecimal deepWorkH, BigDecimal adminH,
            BigDecimal reviewH, BigDecimal otherH) {

        WeeklyReport report = WeeklyReport.builder()
                .author(author)
                .reviewer(reviewer)
                .team(team)
                .weekYear(weekYear)
                .weekNumber(weekNumber)
                .status(status)
                .overallMood(mood)
                .weekSummary(summary)
                .achievements(achievements)
                .keyAchievement(keyAchievement)
                .blockers(blockers)
                .keyIssue(keyIssue)
                .nextWeekPlan(nextWeekPlan)
                .currentVersion(1)
                .submittedAt(submittedAt)
                .reviewedAt(reviewedAt)
                .build();

        WeeklyReport saved = reportRepository.save(report);

        for (int i = 0; i < tasks.length; i++) {
            TaskDef t = tasks[i];
            taskRepository.save(ReportTask.builder()
                    .report(saved)
                    .title(t.title())
                    .status(t.status())
                    .priority(t.priority())
                    .hoursSpent(t.hours())
                    .sortOrder(i)
                    .build());
        }

        BigDecimal total = meetingH.add(deepWorkH).add(adminH).add(reviewH).add(otherH);
        breakdownRepository.save(ReportHoursBreakdown.builder()
                .report(saved)
                .meeting_hours(meetingH)
                .deep_work_hours(deepWorkH)
                .admin_hours(adminH)
                .review_hours(reviewH)
                .other_hours(otherH)
                .total_hours(total)
                .build());

        return saved;
    }
}