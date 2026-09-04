# Weekly Report Generator & Team Dashboard
## Enterprise-Grade Project Specification Document

**Version:** 1.1.0
**Date:** September 2026
**Status:** Draft
**Changelog:** v1.1.0 — Extracted `department` and `job_title` from `users` into normalized `departments` and `job_titles` tables with FK relationships. Added `Department` and `JobTitle` entities, repositories, service, and CRUD endpoints.

---

## Table of Contents

1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack Justification](#3-tech-stack-justification)
4. [User Roles & Permissions Matrix](#4-user-roles--permissions-matrix)
5. [Feature Specifications](#5-feature-specifications)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [Pages / Views Plan](#8-pages--views-plan)
9. [Report Status State Machine](#9-report-status-state-machine)
10. [Seeding Plan](#10-seeding-plan)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Testing Strategy](#12-testing-strategy)
13. [Deployment Plan](#13-deployment-plan)
14. [Open Questions / Future Improvements](#14-open-questions--future-improvements)

---

## 1. Project Overview & Objectives

### 1.1 Executive Summary

The **Weekly Report Generator & Team Dashboard** is an internal productivity and accountability platform designed to streamline how engineering and cross-functional teams capture, review, and analyze weekly work activity. It replaces ad-hoc status updates (Slack messages, spreadsheets, email threads) with a structured, auditable, role-aware system that produces consistent data suitable for team analytics and executive reporting.

### 1.2 Problem Statement

Organizations commonly suffer from:

- **Inconsistent reporting**: Each team member uses different formats, omitting critical context.
- **No review workflow**: Reports are submitted into a void with no formal approval or correction loop.
- **Zero visibility**: Managers have no single pane of glass for tracking team output across weeks.
- **Lost history**: Past reports are buried in email or Slack and are unsearchable.
- **Manual aggregation**: Generating team-wide summaries requires hours of manual copy-paste.

### 1.3 Project Objectives

| # | Objective | Success Metric |
|---|-----------|----------------|
| O1 | Provide a structured, fixed-format weekly report form | 100% of reports follow the same schema |
| O2 | Implement a formal review/correction workflow | Reports move through DRAFT → SUBMITTED → APPROVED or NEEDS_CORRECTION |
| O3 | Give managers a real-time team dashboard | Dashboard loads in < 2s with filters for week, project, and status |
| O4 | Enable project/category management | CRUD available to ADMIN and MANAGER roles |
| O5 | Surface visual analytics (charts, metrics) | At least 5 distinct chart types on the dashboard |
| O6 | Lay groundwork for AI chat assistant | Stateless endpoint ready for LLM integration |
| O7 | Full RBAC enforcement at API level | Every endpoint has a tested role guard |
| O8 | Auditable history | All report state changes captured with timestamps and actor |

### 1.4 Scope

**In Scope (v1.0)**
- Backend REST API (Spring Boot 4.x)
- JWT-based authentication and RBAC
- Weekly report CRUD with draft/submit/approve/reject workflow
- Manager team dashboard with filters
- Project and category management
- Notifications (in-app, stored in DB)
- Seed data for demo purposes
- React frontend (designed in parallel, shipped in Phase 3)

**Out of Scope (v1.0)**
- Mobile application
- Email/SMS notification delivery
- Calendar integrations (Google, Outlook)
- AI Chat Assistant (architecture planned, implementation deferred to v1.1)
- Multi-tenant / multi-organization support

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │              React SPA (Browser)                          │     │
│   │  ┌────────────┐ ┌──────────────┐ ┌───────────────────┐  │     │
│   │  │ Auth Pages │ │ Report Pages │ │  Dashboard Pages  │  │     │
│   │  └────────────┘ └──────────────┘ └───────────────────┘  │     │
│   │         │              │                    │             │     │
│   │         └──────────────┴────────────────────┘            │     │
│   │                    Axios / Fetch                          │     │
│   │              (JWT in Authorization header)                │     │
│   └──────────────────────────────────────────────────────────┘     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │  HTTPS / REST (JSON)
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                          APPLICATION TIER                           │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │         Spring Boot 4.x Application Server                │     │
│   │                                                           │     │
│   │  ┌─────────────────────────────────────────────────┐    │     │
│   │  │          Spring Security Filter Chain            │    │     │
│   │  │  [CorsFilter] → [JwtAuthFilter] → [AuthzFilter] │    │     │
│   │  └──────────────────────┬──────────────────────────┘    │     │
│   │                         │                                │     │
│   │  ┌──────────────────────▼──────────────────────────┐    │     │
│   │  │              REST Controllers Layer              │    │     │
│   │  │  AuthController │ ReportController │ TeamCtrl   │    │     │
│   │  │  ProjectController │ DashboardController        │    │     │
│   │  └──────────────────────┬──────────────────────────┘    │     │
│   │                         │                                │     │
│   │  ┌──────────────────────▼──────────────────────────┐    │     │
│   │  │               Service Layer                      │    │     │
│   │  │  AuthService │ ReportService │ DashboardService  │    │     │
│   │  │  NotificationService │ ProjectService            │    │     │
│   │  └──────────────────────┬──────────────────────────┘    │     │
│   │                         │                                │     │
│   │  ┌──────────────────────▼──────────────────────────┐    │     │
│   │  │            Repository Layer (JPA)                │    │     │
│   │  │  UserRepo │ ReportRepo │ TeamRepo │ ProjectRepo  │    │     │
│   │  └──────────────────────┬──────────────────────────┘    │     │
│   └─────────────────────────┼───────────────────────────────┘     │
└─────────────────────────────┼───────────────────────────────────────┘
                              │  JDBC / Hibernate ORM
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                           DATA TIER                                 │
│                                                                     │
│   ┌──────────────────────────┐    ┌───────────────────────────┐    │
│   │      PostgreSQL 16        │    │     (Future) Redis Cache  │    │
│   │   weekly_reports_db       │    │    Session / Rate Limit   │    │
│   └──────────────────────────┘    └───────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Backend Package Structure

```
com.example.backend/
├── config/
│   ├── SecurityConfig.java
│   ├── BeansConfig.java
│   ├── CorsConfig.java
│   └── OpenApiConfig.java
├── auth/
│   ├── controller/AuthController.java
│   ├── service/AuthService.java
│   ├── dto/LoginRequest.java
│   ├── dto/RegisterRequest.java
│   └── dto/AuthResponse.java
├── security/
│   ├── JwtService.java
│   └── JwtFilter.java
├── user/
│   ├── controller/UserController.java
│   ├── service/UserService.java
│   ├── repository/UserRepository.java
│   └── User.java
├── role/
│   ├── Role.java
│   └── RoleRepository.java
├── department/
│   ├── controller/DepartmentController.java
│   ├── service/DepartmentService.java
│   ├── repository/DepartmentRepository.java
│   ├── repository/JobTitleRepository.java
│   ├── model/Department.java
│   └── model/JobTitle.java
├── team/
│   ├── controller/TeamController.java
│   ├── service/TeamService.java
│   ├── repository/TeamRepository.java
│   └── model/Team.java
├── report/
│   ├── controller/ReportController.java
│   ├── service/ReportService.java
│   ├── repository/WeeklyReportRepository.java
│   ├── model/WeeklyReport.java
│   ├── model/ReportTask.java
│   ├── model/ReportHoursBreakdown.java
│   ├── model/ReportVersion.java
│   ├── model/ReportComment.java
│   └── enums/ReportStatus.java
├── project/
│   ├── controller/ProjectController.java
│   ├── service/ProjectService.java
│   ├── repository/ProjectRepository.java
│   ├── repository/CategoryRepository.java
│   ├── model/Project.java
│   └── model/Category.java
├── dashboard/
│   ├── controller/DashboardController.java
│   ├── service/DashboardService.java
│   └── dto/DashboardSummaryDto.java
├── notification/
│   ├── controller/NotificationController.java
│   ├── service/NotificationService.java
│   ├── repository/NotificationRepository.java
│   └── model/Notification.java
├── ai/
│   ├── controller/AiChatController.java
│   └── service/AiChatService.java          ← stub for v1.1
├── common/
│   ├── exception/GlobalExceptionHandler.java
│   ├── exception/ResourceNotFoundException.java
│   ├── exception/ForbiddenActionException.java
│   ├── dto/PagedResponse.java
│   ├── dto/ApiError.java
│   └── util/WeekUtils.java
└── seed/
    └── DataSeeder.java
```

### 2.3 Authentication Flow

```
Client                  JwtAuthFilter              SecurityContext         Controller
  │                          │                           │                     │
  │──── POST /auth/login ────►│                           │                     │
  │                          │── validate credentials ──►│                     │
  │                          │◄─ UserDetails ────────────│                     │
  │                          │── generate JWT ──────────►│                     │
  │◄── 200 { token, user } ──│                           │                     │
  │                          │                           │                     │
  │──── GET /api/reports ────►│                           │                     │
  │     Authorization:        │                           │                     │
  │     Bearer <token>        │                           │                     │
  │                          │── parse & validate JWT ──►│                     │
  │                          │── set Authentication ─────►│                     │
  │                          │                           │──── invoke ─────────►│
  │                          │                           │◄─── @PreAuthorize ──│
  │                          │                           │     check roles     │
  │◄───────────────────────────────────────────── 200 response ────────────────│
  │                          │                           │                     │
  │──── GET /api/reports ────►│ (expired token)           │                     │
  │                          │── token expired ──────────│                     │
  │◄── 401 Unauthorized ──────│                           │                     │
```

---

## 3. Tech Stack Justification

### 3.1 Backend

| Technology | Version | Justification |
|------------|---------|---------------|
| **Spring Boot** | 4.x | Industry standard for production Java microservices. Autoconfiguration reduces boilerplate. |
| **Java** | 17 LTS | Long-term support, records, sealed classes, pattern matching. Stable until 2029+. |
| **Spring Security** | 6.x | Battle-tested RBAC and filter chain. `@PreAuthorize` integrates cleanly with method-level security. |
| **JWT (jjwt 0.12.6)** | 0.12.6 | Stateless auth eliminates server-side session storage. HMAC-SHA256 signing. |
| **Spring Data JPA + Hibernate** | 6.x | ORM reduces JDBC boilerplate. Named queries, pagination, auditing with `@CreatedDate` / `@LastModifiedDate`. |
| **PostgreSQL** | 16 | ACID-compliant, JSONB support, powerful window functions for analytics. |
| **Lombok** | Latest | Eliminates getter/setter/constructor boilerplate. `@Builder`, `@Data`, `@Slf4j`. |

### 3.2 Frontend

| Technology | Version | Justification |
|------------|---------|---------------|
| **React** | 18+ | Component model fits dashboard decomposition. Concurrent rendering improves perceived performance. |
| **Redux Toolkit** | 2.x | Predictable state management for auth tokens, report state. RTK Query for server state caching. |
| **Recharts / Chart.js** | Latest | Declarative chart composition inside React render tree. |
| **shadcn/ui** | Latest | Accessible, unstyled components built on Radix UI. Tailwind-compatible. |
| **Axios** | 1.x | Interceptor support for automatic JWT injection and 401 → logout handling. |

### 3.3 Infrastructure

| Technology | Justification |
|------------|---------------|
| **Docker + Docker Compose** | Reproducible local dev. `backend`, `postgres`, and (future) `redis` in a single compose file. |
| **Spring profiles** | `dev` (local PG), `test` (TestContainers), `prod` (hardened config from env vars). |
| **Flyway** | Versioned database migrations. Ensures schema consistency across all environments. |

---

## 4. User Roles & Permissions Matrix

### 4.1 Role Definitions

| Role | Description |
|------|-------------|
| `TEAM_MEMBER` | A regular employee. Can manage their own reports only. Cannot see other members' reports. |
| `MANAGER` | Manages one or more teams. Can view all reports in their team(s), approve/reject, and access the team dashboard. |
| `ADMIN` | System administrator. Full access to all users, teams, projects, and reports. |

### 4.2 Permissions Matrix

| Feature / Action | TEAM_MEMBER | MANAGER | ADMIN |
|------------------|:-----------:|:-------:|:-----:|
| **Auth** | | | |
| Register / Login / Logout | Yes | Yes | Yes |
| Change own password | Yes | Yes | Yes |
| Edit any user profile | No | No | Yes |
| Assign roles to users | No | No | Yes |
| **Reports** | | | |
| Create own weekly report | Yes | Yes | Yes |
| Edit own DRAFT / NEEDS_CORRECTION report | Yes | Yes | Yes |
| Submit own report | Yes | Yes | Yes |
| View team reports | No | Yes | Yes |
| Approve / Request correction | No | Yes | Yes |
| View report version history | Own only | Team | All |
| **Teams** | | | |
| Create / delete teams | No | No | Yes |
| Add / remove team members | No | Yes (own) | Yes |
| **Departments & Job Titles** | | | |
| View departments / job titles | Yes | Yes | Yes |
| Create / edit / deactivate department | No | No | Yes |
| Create / edit / deactivate job title | No | No | Yes |
| Delete department / job title | No | No | Yes |
| **Projects & Categories** | | | |
| View projects list | Yes | Yes | Yes |
| Create / edit / delete project | No | Yes | Yes |
| **Dashboard** | | | |
| View personal dashboard | Yes | Yes | Yes |
| View team dashboard | No | Yes | Yes |
| View org-wide analytics | No | No | Yes |
| Export dashboard data (CSV) | No | Yes | Yes |
| **AI Chat (v1.1)** | Yes | Yes | Yes |

---

## 5. Feature Specifications

### 5.1 Authentication & Authorization

#### 5.1.1 Registration

**Flow:**
1. Client submits `POST /api/auth/register` with email, password, full name.
2. Backend validates: email uniqueness, password strength (min 8 chars, 1 uppercase, 1 digit, 1 special char).
3. Password is hashed with `BCryptPasswordEncoder`.
4. User is created with default role `TEAM_MEMBER`.
5. JWT is returned so the user is immediately logged in post-registration.

#### 5.1.2 Login

**Flow:**
1. Client submits `POST /api/auth/login` with email + password.
2. `AuthenticationManager.authenticate()` is called.
3. On success: generate access token (JWT) + refresh token.
4. Return `{ accessToken, user: { id, email, roles, teamId } }`.

#### 5.1.3 JWT Structure

```json
{
  "sub": "user-uuid",
  "email": "alice@company.com",
  "authorities": ["ROLE_TEAM_MEMBER"],
  "iat": 1756000000,
  "exp": 1756000900
}
```

#### 5.1.4 Logout & Token Revocation

JWT is stateless by design — once issued it is valid until expiry. To make logout meaningful, a **blocklist approach** is used:

1. Client sends `POST /auth/logout` with `Authorization: Bearer <token>`.
2. The token is saved to the `tokens` table with `revoked = true` and `expired = true`.
3. `JwtFilter` checks the blocklist on every request — if the token is found with `revoked || expired`, the request is rejected with `401`.
4. The token is **only** written to `tokens` on logout, not on login, keeping the DB load minimal (valid tokens never touch the DB).

> Note: `/auth/logout` is excluded from the `/auth/**` filter bypass so the JWT is still extracted and the user identity can be resolved before revoking.

#### 5.1.5 Role Assignment (ADMIN only)

- `PUT /api/admin/users/{id}/roles` — replaces the user's role set.

---

### 5.2 Personal Weekly Report Page

#### 5.2.1 Report Structure (Fixed Fields)

| Section | Field | Type | Required |
|---------|-------|------|----------|
| **Header** | weekYear | Integer | Yes |
| | weekNumber | Integer | Yes |
| | status | Enum | Yes |
| **Summary** | weekSummary | Text | Yes (on submit) |
| | overallMood | Enum | No |
| | blockers | Text | No |
| | nextWeekPlan | Text | No |
| **Tasks** (repeating) | taskTitle | String | Yes |
| | projectId | UUID (FK) | No |
| | categoryId | UUID (FK) | No |
| | hoursSpent | Decimal | Yes |
| | completionStatus | Enum | Yes |
| | priority | Enum | No |
| **Hours Breakdown** | meetingHours | Decimal | No |
| | deepWorkHours | Decimal | No |
| | adminHours | Decimal | No |
| | reviewHours | Decimal | No |
| | totalHours | Decimal | Computed |

**Business Rules:**
- One report per user per ISO week. Duplicate → `409 Conflict`.
- Editing only allowed in `DRAFT` or `NEEDS_CORRECTION` status.
- A report can only be submitted if it has at least one task.

#### 5.2.2 Draft / Submit Flow

```
User fills in form
       │
       ├── [Auto-save every 30s] → PATCH /api/reports/{id} (status stays DRAFT)
       │
       └── [Submit button clicked]
                  │
                  ├── Frontend validation fails → show errors
                  │
                  └── POST /api/reports/{id}/submit
                             │
                             ▼
                        status → SUBMITTED
                        notification → Manager
```

---

### 5.3 Report Review & Correction Workflow

#### 5.3.1 Manager Review Actions

| Action | Endpoint | Result |
|--------|----------|--------|
| Approve | `POST /reports/{id}/approve` | Status → `APPROVED`. Notification to author. |
| Request Correction | `POST /reports/{id}/request-correction` | Status → `NEEDS_CORRECTION`. Comment required. Notification to author. |

#### 5.3.2 Versioning

Every time a report transitions from `NEEDS_CORRECTION` → `SUBMITTED`, a full JSON snapshot of the current report is saved to `report_versions`. Managers can view all past versions.

---

### 5.4 Team Dashboard (Manager View)

#### Filters

| Filter | Type |
|--------|------|
| Week | Date picker |
| Team Member | Multi-select |
| Status | Multi-select |
| Project | Multi-select |
| Date Range | Range picker |

#### Table Columns

Avatar + Name, Week, Status (badge), Hours, Tasks count, Submitted At, Actions (View / Approve / Request Correction).

---

### 5.5 Projects / Categories CRUD

- **Projects**: name (unique), description, color hex, isActive, createdBy.
- **Categories**: name (unique), description, color hex, optional projectId.
- Deactivating a project does not delete historical tasks linked to it.

---

### 5.6 Dashboard & Visual Insights

#### Personal Dashboard Widgets

| Widget | Chart Type |
|--------|-----------|
| My Hours This Week | KPI card |
| Hours by Project | Donut / Pie |
| Weekly Hours Trend | Line chart |
| Task Completion Rate | Gauge / Progress |
| Mood Over Time | Area chart |

#### Manager / Admin Dashboard Widgets

| Widget | Chart Type |
|--------|-----------|
| Team Submission Status | Stacked bar |
| Hours by Project (Team) | Grouped bar |
| Team Hours Trend | Multi-line |
| Report Submission Timeliness | Scatter plot |
| Approval Turnaround | KPI card |
| Hours Breakdown Radar | Radar chart |

---

### 5.7 AI Chat Assistant (Planned for v1.1)

In v1.0: the endpoint `POST /api/ai/chat` is wired and returns a static stub response. The service interface is defined so swapping in a real LLM requires only service layer changes.

**Intended capabilities (v1.1):**
- "Summarize my last 4 weeks of work"
- "What projects did I spend the most time on in August?"
- "Draft my weekly summary based on my tasks"
- "What were the main blockers for my team last month?" (Manager only)

---

## 6. Database Schema

### 6.1 Conventions

- All timestamps are `TIMESTAMP WITH TIME ZONE` (stored as UTC).
- Enums stored as `VARCHAR` via `@Enumerated(EnumType.STRING)`.
- Audit columns (`created_date`, `last_modified_date`) on every entity via Spring Data JPA Auditing.

### 6.2 Enum Types

```java
// ReportStatus.java
public enum ReportStatus {
    DRAFT, SUBMITTED, NEEDS_CORRECTION, APPROVED
}

// TaskStatus.java
public enum TaskStatus {
    NOT_STARTED, IN_PROGRESS, COMPLETED, CARRIED_OVER, BLOCKED
}

// TaskPriority.java
public enum TaskPriority {
    HIGH, MEDIUM, LOW
}

// NotificationType.java
public enum NotificationType {
    REPORT_SUBMITTED, REPORT_APPROVED, REPORT_NEEDS_CORRECTION, SYSTEM
}
```

### 6.3 Table Definitions

#### `roles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK, sequence `role_seq` |
| name | VARCHAR(50) | NOT NULL, UNIQUE |
| created_date | TIMESTAMP | NOT NULL, not updatable |
| last_modified_date | TIMESTAMP | NOT NULL |

#### `departments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | NULLABLE |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| created_date | TIMESTAMP | NOT NULL, not updatable |
| last_modified_date | TIMESTAMP | NOT NULL |

#### `job_titles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| title | VARCHAR(150) | NOT NULL, UNIQUE |
| level | VARCHAR(20) | NOT NULL — `JUNIOR`, `MID`, `SENIOR`, `LEAD`, `PRINCIPAL`, `MANAGER` |
| department_id | BIGINT | NULLABLE, FK → departments(id) |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| created_date | TIMESTAMP | NOT NULL, not updatable |
| last_modified_date | TIMESTAMP | NOT NULL |

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK, sequence `user_seq` |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| department_id | BIGINT | NULLABLE, FK → departments(id) |
| job_title_id | BIGINT | NULLABLE, FK → job_titles(id) |
| avatar_url | VARCHAR(512) | NULLABLE |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| account_locked | BOOLEAN | NOT NULL, DEFAULT FALSE |
| created_date | TIMESTAMP | NOT NULL, not updatable |
| last_modified_date | TIMESTAMP | NOT NULL |

#### `user_roles` (join table)
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | BIGINT | PK, FK → users(id) CASCADE |
| role_id | INTEGER | PK, FK → roles(id) RESTRICT |

#### `teams`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| name | VARCHAR(150) | NOT NULL, UNIQUE |
| description | TEXT | NULLABLE |
| manager_id | BIGINT | NOT NULL, FK → users(id) |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| created_date | TIMESTAMP | NOT NULL, not updatable |
| last_modified_date | TIMESTAMP | NOT NULL |

#### `team_members` (join table)
| Column | Type | Constraints |
|--------|------|-------------|
| team_id | BIGINT | PK, FK → teams(id) CASCADE |
| user_id | BIGINT | PK, FK → users(id) CASCADE |
| joined_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

#### `projects`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| name | VARCHAR(200) | NOT NULL, UNIQUE |
| description | TEXT | NULLABLE |
| color_hex | CHAR(7) | NULLABLE |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| created_by | BIGINT | FK → users(id), NULLABLE |
| created_date | TIMESTAMP | NOT NULL |
| last_modified_date | TIMESTAMP | NOT NULL |

#### `categories`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | VARCHAR(255) | NULLABLE |
| color_hex | CHAR(7) | NULLABLE |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| created_date | TIMESTAMP | NOT NULL |

#### `weekly_reports`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| author_id | BIGINT | NOT NULL, FK → users(id) |
| reviewer_id | BIGINT | NULLABLE, FK → users(id) |
| week_year | SMALLINT | NOT NULL |
| week_number | SMALLINT | NOT NULL (1–53) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'DRAFT' |
| week_summary | TEXT | NULLABLE |
| overall_mood | VARCHAR(20) | NULLABLE |
| blockers | TEXT | NULLABLE |
| next_week_plan | TEXT | NULLABLE |
| submitted_at | TIMESTAMP | NULLABLE |
| reviewed_at | TIMESTAMP | NULLABLE |
| current_version | SMALLINT | NOT NULL, DEFAULT 1 |
| created_date | TIMESTAMP | NOT NULL |
| last_modified_date | TIMESTAMP | NOT NULL |
| **UNIQUE** | (author_id, week_year, week_number) | One report per user per week |

#### `report_tasks`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| report_id | BIGINT | NOT NULL, FK → weekly_reports(id) CASCADE |
| project_id | BIGINT | NULLABLE, FK → projects(id) |
| category_id | BIGINT | NULLABLE, FK → categories(id) |
| title | VARCHAR(300) | NOT NULL |
| description | TEXT | NULLABLE |
| status | VARCHAR(20) | NOT NULL |
| priority | VARCHAR(10) | NULLABLE |
| hours_spent | DECIMAL(5,2) | NOT NULL |
| planned_pct | DECIMAL(5,2) | NULLABLE |
| actual_pct | DECIMAL(5,2) | NULLABLE |
| time_planned | DECIMAL(5,2) | NULLABLE |
| output_deliverable | TEXT | NULLABLE |
| sort_order | SMALLINT | NOT NULL, DEFAULT 0 |
| created_date | TIMESTAMP | NOT NULL |
| last_modified_date | TIMESTAMP | NOT NULL |

#### `report_hours_breakdown`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| report_id | BIGINT | NOT NULL, UNIQUE, FK → weekly_reports(id) CASCADE |
| meeting_hours | DECIMAL(4,1) | NOT NULL, DEFAULT 0 |
| deep_work_hours | DECIMAL(4,1) | NOT NULL, DEFAULT 0 |
| admin_hours | DECIMAL(4,1) | NOT NULL, DEFAULT 0 |
| review_hours | DECIMAL(4,1) | NOT NULL, DEFAULT 0 |
| other_hours | DECIMAL(4,1) | NOT NULL, DEFAULT 0 |
| total_hours | DECIMAL(5,1) | Computed (sum of above) |

#### `report_versions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| report_id | BIGINT | NOT NULL, FK → weekly_reports(id) CASCADE |
| version_number | SMALLINT | NOT NULL |
| snapshot_json | TEXT | NOT NULL — full JSON of report at time of snapshot |
| created_by | BIGINT | FK → users(id) |
| created_date | TIMESTAMP | NOT NULL |
| **UNIQUE** | (report_id, version_number) | |

#### `report_comments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| report_id | BIGINT | NOT NULL, FK → weekly_reports(id) CASCADE |
| author_id | BIGINT | NOT NULL, FK → users(id) |
| body | TEXT | NOT NULL |
| is_correction_request | BOOLEAN | NOT NULL, DEFAULT FALSE |
| version_number | SMALLINT | NULLABLE — which version this comment is against |
| created_date | TIMESTAMP | NOT NULL |

#### `notifications`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PK |
| recipient_id | BIGINT | NOT NULL, FK → users(id) CASCADE |
| sender_id | BIGINT | NULLABLE, FK → users(id) |
| type | VARCHAR(30) | NOT NULL |
| title | VARCHAR(200) | NOT NULL |
| message | TEXT | NULLABLE |
| related_report_id | BIGINT | NULLABLE, FK → weekly_reports(id) CASCADE |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE |
| read_at | TIMESTAMP | NULLABLE |
| created_date | TIMESTAMP | NOT NULL |

### 6.4 Key Indexes

| Table | Columns | Reason |
|-------|---------|--------|
| `users` | `email` | Login lookup on every auth request |
| `weekly_reports` | `author_id` | Fetch all reports for a user |
| `weekly_reports` | `(week_year, week_number)` | Date-range filtering on dashboard |
| `weekly_reports` | `status` | Filter by status on dashboard |
| `report_tasks` | `report_id` | Fetch all tasks for a report |
| `report_tasks` | `project_id` | Cross-report project analytics |
| `report_versions` | `(report_id, version_number)` | Version history lookup |
| `notifications` | `(recipient_id, is_read)` | Unread count badge on every page load |

---

## 7. API Design

### 7.1 Global Conventions

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <jwt>` (except `/auth/**`)
- Content-Type: `application/json`
- Dates: ISO 8601
- Pagination: `?page=0&size=20&sort=createdAt,desc`

**Paginated response wrapper:**
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 143,
  "totalPages": 8,
  "last": false
}
```

**Error response:**
```json
{
  "timestamp": "2026-09-01T10:00:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have permission to approve this report",
  "path": "/api/v1/reports/abc/approve"
}
```

---

### 7.2 Auth Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register new user. Sends activation email. |
| `POST` | `/auth/login` | Public | Authenticate. Returns access token + user profile. Also mapped as `/auth/authenticate`. |
| `GET`  | `/auth/activate-account` | Public | Activates account via 6-digit token sent by email. |
| `POST` | `/auth/logout` | Authenticated | Revokes the JWT by adding it to the token blocklist (`tokens` table with `revoked=true`). Subsequent requests with the same token are rejected with 401. |
| `GET`  | `/auth/me` | Authenticated | Returns current user profile + roles. |

---

### 7.3 User Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/users` | ADMIN | List all users (paginated). |
| `GET`    | `/users/{id}` | ADMIN or self | Get user by ID. |
| `PUT`    | `/users/{id}` | ADMIN or self | Update profile. |
| `DELETE` | `/users/{id}` | ADMIN | Soft-delete user. |
| `PUT`    | `/users/{id}/roles` | ADMIN | Replace user's roles. |
| `PUT`    | `/users/{id}/password` | Self | Change own password. |

---

### 7.4 Team Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/teams` | ADMIN | List all teams. |
| `POST`   | `/teams` | ADMIN | Create team. |
| `GET`    | `/teams/{id}` | MANAGER (own), ADMIN | Team details + members. |
| `PUT`    | `/teams/{id}` | ADMIN | Update team. |
| `DELETE` | `/teams/{id}` | ADMIN | Delete team. |
| `POST`   | `/teams/{id}/members` | MANAGER, ADMIN | Add member. |
| `DELETE` | `/teams/{id}/members/{userId}` | MANAGER, ADMIN | Remove member. |

---

### 7.5 Report Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/reports` | MANAGER, ADMIN | List all reports (paginated, filterable). |
| `GET`    | `/reports/my` | All | List current user's reports. |
| `POST`   | `/reports` | All | Create new report (draft). |
| `GET`    | `/reports/{id}` | Author, MANAGER, ADMIN | Get report detail. |
| `PATCH`  | `/reports/{id}` | Author (DRAFT or NEEDS_CORRECTION) | Auto-save update. |
| `PUT`    | `/reports/{id}` | Author (DRAFT or NEEDS_CORRECTION) | Full update. |
| `POST`   | `/reports/{id}/submit` | Author | Submit for review. |
| `POST`   | `/reports/{id}/approve` | MANAGER, ADMIN | Approve report. |
| `POST`   | `/reports/{id}/request-correction` | MANAGER, ADMIN | Request correction (comment required). |
| `GET`    | `/reports/{id}/versions` | Author, MANAGER, ADMIN | List version history. |
| `GET`    | `/reports/{id}/versions/{versionNumber}` | Author, MANAGER, ADMIN | Get specific version. |
| `GET`    | `/reports/{id}/comments` | Author, MANAGER, ADMIN | List comments. |
| `POST`   | `/reports/{id}/comments` | MANAGER, ADMIN | Add comment. |

**Query params for `GET /reports`:**

| Param | Type | Example |
|-------|------|---------|
| `weekYear` | int | `2026` |
| `weekNumber` | int | `35` |
| `status` | enum | `SUBMITTED` |
| `authorId` | UUID | `uuid` |
| `teamId` | UUID | `uuid` |
| `projectId` | UUID | `uuid` |
| `page` | int | `0` |
| `size` | int | `20` |
| `sort` | string | `submittedAt,desc` |

---

### 7.6 Report Task Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/reports/{reportId}/tasks` | Author, MANAGER, ADMIN | List tasks. |
| `POST`   | `/reports/{reportId}/tasks` | Author | Add task. |
| `PUT`    | `/reports/{reportId}/tasks/{taskId}` | Author | Update task. |
| `DELETE` | `/reports/{reportId}/tasks/{taskId}` | Author | Delete task. |
| `PUT`    | `/reports/{reportId}/tasks/reorder` | Author | Reorder (send ordered list of IDs). |

---

### 7.7 Project Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/projects` | All | List active projects. |
| `POST`   | `/projects` | MANAGER, ADMIN | Create project. |
| `GET`    | `/projects/{id}` | All | Get detail. |
| `PUT`    | `/projects/{id}` | MANAGER, ADMIN | Update. |
| `PATCH`  | `/projects/{id}/deactivate` | MANAGER, ADMIN | Soft-deactivate. |
| `DELETE` | `/projects/{id}` | ADMIN | Delete (only if no tasks linked). |

---

### 7.8 Category Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/categories` | All | List all categories. |
| `POST`   | `/categories` | MANAGER, ADMIN | Create. |
| `PUT`    | `/categories/{id}` | MANAGER, ADMIN | Update. |
| `DELETE` | `/categories/{id}` | ADMIN | Delete. |

---

### 7.9 Department Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/departments` | All | List all active departments. |
| `POST`   | `/departments` | ADMIN | Create department. |
| `GET`    | `/departments/{id}` | All | Get department detail. |
| `PUT`    | `/departments/{id}` | ADMIN | Update department. |
| `PATCH`  | `/departments/{id}/deactivate` | ADMIN | Soft-deactivate. |
| `DELETE` | `/departments/{id}` | ADMIN | Delete (only if no users linked). |
| `GET`    | `/departments/{id}/job-titles` | All | List job titles scoped to this department. |

---

### 7.10 Job Title Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/job-titles` | All | List all active job titles. Filterable by `?departmentId=` and `?level=`. |
| `POST`   | `/job-titles` | ADMIN | Create job title. |
| `GET`    | `/job-titles/{id}` | All | Get job title detail. |
| `PUT`    | `/job-titles/{id}` | ADMIN | Update job title. |
| `PATCH`  | `/job-titles/{id}/deactivate` | ADMIN | Soft-deactivate. |
| `DELETE` | `/job-titles/{id}` | ADMIN | Delete (only if no users linked). |

---

### 7.11 Dashboard Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/dashboard/personal` | All | Personal stats: hours trend, mood trend, task completion rate. |
| `GET` | `/dashboard/team` | MANAGER, ADMIN | Team summary: submission status, hours by project. |
| `GET` | `/dashboard/team/reports` | MANAGER, ADMIN | Paginated team report table with filters. |
| `GET` | `/dashboard/team/hours-by-project` | MANAGER, ADMIN | Hours per project per member for a date range. |
| `GET` | `/dashboard/admin/overview` | ADMIN | Org-wide: total users, reports, approval rates. |

---

### 7.12 Notification Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET`    | `/notifications` | All | List own notifications (paginated). |
| `PATCH`  | `/notifications/{id}/read` | All | Mark single notification as read. |
| `PATCH`  | `/notifications/read-all` | All | Mark all as read. |
| `GET`    | `/notifications/unread-count` | All | Returns `{ "count": 3 }`. |

---

### 7.13 AI Chat Endpoints (Stub in v1.0)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/ai/chat` | All | Send message. Returns static response in v1.0. |

---

## 8. Pages / Views Plan

| # | Page | Route | Roles | Description |
|---|------|-------|-------|-------------|
| 1 | Login | `/login` | Public | Email + password form. |
| 2 | Register | `/register` | Public | Registration with role selection. |
| 3 | My Reports | `/reports` | All | List of own reports by week with status badges. |
| 4 | Report Form | `/reports/new`, `/reports/:id/edit` | All | Full report form with task rows, hours breakdown, mood picker, auto-save. |
| 5 | Report Detail | `/reports/:id` | All | Read-only view. Comments. Version history tab. Approve/Reject buttons for managers. |
| 6 | Team Dashboard | `/dashboard/team` | MANAGER, ADMIN | Filters + KPI cards + report table + charts. |
| 7 | Personal Dashboard | `/dashboard` | All | Personal charts: hours trend, mood, project distribution. |
| 8 | Projects & Categories | `/projects` | All (write: MANAGER, ADMIN) | CRUD table for projects and categories. |
| 9 | User Management | `/admin/users` | ADMIN | User table with role assignment modal and soft-delete. |
| 10 | Team Management | `/admin/teams` | ADMIN | Create teams, assign manager, manage members. |
| 11 | Notifications | `/notifications` | All | Full notification list with read/unread toggle. |
| 12 | AI Chat | `/ai-chat` | All | Chat UI shell. Stub response in v1.0. |
| 13 | Profile / Settings | `/profile` | All | Edit name, avatar, change password. |
| 14 | Department & Job Title Management | `/admin/departments` | ADMIN | CRUD table for departments and job titles with level classification. |

---

## 9. Report Status State Machine

### 9.1 State Diagram

```
                      ┌──────────────────────────────────────┐
                      │                                      │
                      ▼                                      │
                   ┌──────┐                                  │
     ─────────────►│DRAFT │                                  │
     │             └──┬───┘                                  │
     │                │ [author submits]                     │
     │                ▼                                      │
     │          ┌───────────┐      [manager approves]   ┌──────────┐
     │          │ SUBMITTED │──────────────────────────►│ APPROVED │
     │          └─────┬─────┘                           └──────────┘
     │                │ [manager requests correction]
     │                ▼
     │       ┌─────────────────┐
     └───────│ NEEDS_CORRECTION│
 [author     └─────────────────┘
 resubmits]
```

### 9.2 State Transition Rules

| From | Action | Actor | To | Side Effects |
|------|--------|-------|-----|-------------|
| _(none)_ | Create | Author | `DRAFT` | `current_version = 1` |
| `DRAFT` | Save | Author | `DRAFT` | `updated_at` refreshed |
| `DRAFT` | Submit | Author | `SUBMITTED` | `submitted_at` set; notification to manager |
| `SUBMITTED` | Approve | MANAGER/ADMIN | `APPROVED` | `reviewed_by`, `reviewed_at` set; notification to author |
| `SUBMITTED` | Request Correction | MANAGER/ADMIN | `NEEDS_CORRECTION` | Comment saved; notification to author |
| `NEEDS_CORRECTION` | Edit | Author | `NEEDS_CORRECTION` | `updated_at` refreshed |
| `NEEDS_CORRECTION` | Re-submit | Author | `SUBMITTED` | Version snapshot saved; `current_version++`; notification to manager |
| `APPROVED` | — | — | `APPROVED` | Terminal. Read-only. |

### 9.3 Guard Conditions

```
submit:
  - report.status IN (DRAFT, NEEDS_CORRECTION)
  - report.authorId == currentUser.id
  - report.tasks.size() >= 1

approve / request-correction:
  - report.status == SUBMITTED
  - currentUser.role IN (MANAGER, ADMIN)

edit:
  - report.status IN (DRAFT, NEEDS_CORRECTION)
  - report.authorId == currentUser.id
```

### 9.4 Version Snapshot Trigger

```
WHEN: status transitions NEEDS_CORRECTION → SUBMITTED
DO:
  snapshot = serialize(report + tasks + hours breakdown)
  INSERT INTO report_versions (report_id, version_number, snapshot_json)
  UPDATE weekly_reports SET current_version = current_version + 1
```

---

## 10. Seeding Plan

### 10.1 Roles

Seeded at startup via `CommandLineRunner` in `BackendApplication`:
- `TEAM_MEMBER`
- `MANAGER`
- `ADMIN`

### 10.2 Users

| Username | Email | Role |
|----------|-------|------|
| admin | admin@company.com | ADMIN |
| manager_bob | bob@company.com | MANAGER |
| alice_dev | alice@company.com | TEAM_MEMBER |
| charlie_fe | charlie@company.com | TEAM_MEMBER |
| diana_qa | diana@company.com | TEAM_MEMBER |
| evan_devops | evan@company.com | TEAM_MEMBER |

All seeded passwords: `SeedPass1!` (BCrypt hashed).

### 10.3 Teams

**"Platform Engineering"** — Manager: Bob Chen, Members: Alice, Charlie, Diana, Evan.

### 10.4 Projects & Categories

**Projects:** Platform Redesign, Q4 Infra Upgrade, Customer Portal, Internal Tooling.

**Categories:** Backend Development, Frontend Development, Code Review, Meetings, DevOps/CI, Documentation, QA/Testing.

### 10.5 Weekly Reports

Seed 8 weeks (W27–W34 2026) for each team member in varied statuses:

| Member | W27–W31 | W32 | W33 | W34 |
|--------|---------|-----|-----|-----|
| Alice | APPROVED | NEEDS_CORRECTION | SUBMITTED | DRAFT |
| Charlie | APPROVED | APPROVED | SUBMITTED | DRAFT |
| Diana | APPROVED | APPROVED | DRAFT | — |
| Evan | APPROVED | DRAFT | — | — |

Each report includes: 3–6 tasks, hours breakdown (35–42h), week summary, random mood, comments on NEEDS_CORRECTION reports.

### 10.6 DataSeeder Sketch

```java
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepo.count() > 0) return; // idempotent
        seedRoles();
        seedUsers();
        seedTeams();
        seedProjects();
        seedReports();
    }
}
```

---

## 11. Implementation Roadmap

### Phase 1 — Auth & Foundation (Weeks 1–2)

| Task |
|------|
| Spring Boot project scaffold, pom.xml dependencies |
| PostgreSQL + Docker Compose + Flyway migrations (V1: roles, users, user_roles, teams) |
| `Role`, `User` entities + repositories |
| `JwtService`, `JwtFilter`, `SecurityConfig`, `BeansConfig` |
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| `@PreAuthorize` RBAC setup |
| `GlobalExceptionHandler` |
| DataSeeder (roles, users, teams) |
| Unit tests: JwtService, AuthService |
| Integration tests: register, login, 401/403 |

**Deliverable:** Postman collection: register → login → JWT-protected endpoint.

---

### Phase 2 — Reports Core (Weeks 3–5)

| Task |
|------|
| Flyway V2: `weekly_reports`, `report_tasks`, `report_hours_breakdown`, `report_versions`, `report_comments` |
| All report entities + repositories |
| `ReportService` — create, update, submit, approve, request-correction, version snapshot |
| `ReportController` — all endpoints from Section 7.5–7.6 |
| State machine guard conditions + `ForbiddenActionException` |
| `NotificationService` — triggers on state transitions |
| `NotificationController` |
| `ProjectController`, `CategoryController` — full CRUD |
| DataSeeder — 8 weeks of reports in varied statuses |
| Unit tests: state machine, guards |
| Integration tests: full submit → approve flow, RBAC per endpoint |

**Deliverable:** All report lifecycle actions working via Postman.

---

### Phase 3 — Dashboard & React UI (Weeks 6–8)

**Backend:**
| Task |
|------|
| `DashboardService` — personal stats aggregation |
| `DashboardController` — all dashboard endpoints |
| Query optimization (no N+1 queries) |

**Frontend:**
| Task |
|------|
| React + Vite + TypeScript + Tailwind + shadcn/ui scaffold |
| Axios instance with JWT interceptor |
| Auth pages (Login, Register) + protected route |
| My Reports page |
| Report Form (auto-save, task rows, hours breakdown, mood picker) |
| Report Detail (read-only, comments, version history) |
| Team Dashboard (filters, KPI cards, table, Recharts) |
| Personal Dashboard (line, donut, area charts) |
| Notification bell with unread count |

**Deliverable:** End-to-end demo: login as Alice → write report → submit → login as Bob → approve.

---

### Phase 4 — Polish, Tests & AI Stub (Weeks 9–10)

| Task |
|------|
| AI Chat stub endpoint + chat UI shell |
| Rate limiting on `/auth/**` endpoints |
| Structured JSON logging |
| Spring Actuator (`/health`, `/info`) |
| OpenAPI / Swagger docs (dev only) |
| Full integration test suite (see Section 12) |
| Multi-stage Docker build + docker-compose.prod.yml |
| Production security checklist |

**Deliverable:** All tests green. Production-ready Docker setup.

---

## 12. Testing Strategy

### 12.1 Testing Pyramid

```
                ┌──────────────┐
                │   E2E Tests  │  ← Optional: Playwright (5–10 user journeys)
                └──────┬───────┘
           ┌───────────┴────────────┐
           │  Integration Tests     │  ← SpringBootTest + TestContainers PostgreSQL
           │  (30–50 tests)         │
           └───────────┬────────────┘
      ┌─────────────────┴──────────────────┐
      │          Unit Tests                 │  ← JUnit 5 + Mockito
      │  (80–120 tests)                     │
      └─────────────────────────────────────┘
```

### 12.2 Key Unit Tests

```java
// JwtServiceTest
void generateToken_shouldContainCorrectClaims()
void validateToken_shouldReturnTrueForValidToken()
void validateToken_shouldReturnFalseForExpiredToken()

// AuthServiceTest
void register_shouldHashPassword()
void register_shouldThrow_whenEmailExists()
void login_shouldReturnToken_whenCredentialsValid()

// ReportServiceTest
void submit_shouldTransitionDraftToSubmitted()
void submit_shouldThrow_whenReportHasNoTasks()
void approve_shouldThrow_whenCalledByTeamMember()
void requestCorrection_shouldTransitionToNeedsCorrection()
void resubmit_shouldSaveVersionSnapshot()
void edit_shouldThrow_whenReportIsApproved()

// RbacTest
void teamMember_cannotApproveReport()
void teamMember_cannotAccessTeamDashboard()
void manager_cannotAccessOtherTeamReports()
void admin_canAccessAllEndpoints()
```

### 12.3 Key Integration Tests

```java
// AuthIntegrationTest
void registerAndLogin_fullFlow()
void register_returns409_onDuplicateEmail()
void protectedEndpoint_returns401_withoutToken()
void protectedEndpoint_returns403_withWrongRole()

// ReportIntegrationTest
void createAndSubmitReport_fullFlow()
void approveReport_happyPath()
void requestCorrection_sendsNotification()
void resubmit_createsVersionSnapshot()
void createReport_returns409_onDuplicateWeek()

// DashboardIntegrationTest
void teamDashboard_returns403_forTeamMember()
void teamDashboard_filtersCorrectlyByStatus()
```

### 12.4 Coverage Targets

| Layer | Target |
|-------|--------|
| Service layer | >= 85% |
| Controller layer | >= 70% (via integration tests) |
| Overall | >= 75% |

---

## 13. Deployment Plan

### 13.1 Environment Profiles

| Profile | Database | Logging | Swagger |
|---------|----------|---------|---------|
| `dev` | Local PostgreSQL | DEBUG | On |
| `test` | TestContainers PG | ERROR | Off |
| `prod` | Managed PostgreSQL (env vars) | INFO (JSON) | Off |

### 13.2 Local Development Setup

**Prerequisites:** Docker Desktop, JDK 17, Node.js 20+, Maven 3.9+

```bash
# 1. Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d postgres

# 2. Run backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# 3. Run frontend
cd frontend && npm install && npm run dev
```

### 13.3 `application-dev.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/weekly_reports_db
spring.datasource.username=app_user
spring.datasource.password=dev_password
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true

application.security.jwt.secret-key=dev-secret-256-bits-minimum-length-for-hs256
application.security.jwt.expiration=86400000

logging.level.com.example.backend=DEBUG
springdoc.swagger-ui.enabled=true
```

### 13.4 Production Dockerfile (Multi-stage)

```dockerfile
# --- Build Stage ---
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# --- Runtime Stage ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
```

### 13.5 Production Security Checklist

| Item | Action |
|------|--------|
| JWT secret | Minimum 256-bit, from environment variable — never in source |
| DB password | Injected from environment variable |
| CORS | Locked to specific frontend origin |
| Swagger UI | Disabled in production |
| `ddl-auto` | Set to `validate` in production |
| Password hashing | BCrypt strength >= 12 |
| Rate limiting | On `/auth/**` endpoints |
| HTTPS | TLS at reverse proxy (Nginx / Caddy) |

---

## 14. Open Questions / Future Improvements

### 14.1 Open Questions

| # | Question | Impact |
|---|----------|--------|
| Q1 | Can ADMIN re-open an APPROVED report? | Report integrity |
| Q2 | Single team per user, or can a user belong to multiple teams? | Schema complexity |
| Q3 | ISO 8601 week boundaries (Monday start) vs Sunday start? | Week calculation utility |
| Q4 | PDF export: server-side (iText) or client-side (browser print)? | Backend complexity |
| Q5 | LLM provider for AI Chat: OpenAI, Anthropic, or self-hosted Ollama? | Cost, privacy |
| Q6 | Real-time notifications (WebSocket/SSE) or polling? | Infrastructure complexity |
| Q7 | Email notifications required (SMTP)? | Infrastructure dependency |

### 14.2 Technical Debt to Watch

| Item | Risk | Mitigation |
|------|------|-----------|
| H2 vs PostgreSQL in tests | Dialect differences → false passes | Use TestContainers from day one |
| N+1 queries on report list | Dashboard slow at scale | Use `@EntityGraph` / JPQL DTO projections |
| `ddl-auto=update` in dev | Schema drift | Switch to Flyway + `validate` early |
| JWT secret rotation | Leaked secret compromises all tokens | Plan RS256 (asymmetric) for v1.1 |

### 14.3 Future Improvements (v1.1+)

| Feature | Priority | Complexity |
|---------|----------|-----------|
| AI Chat with real LLM | High | High |
| Real-time notifications (SSE) | Medium | Medium |
| Email delivery (SMTP) | Medium | Low |
| PDF report export | Medium | Medium |
| Redis caching for dashboard | High (at scale) | Medium |
| Version diff UI (side-by-side) | Low | Medium |
| Audit log table (all state changes) | Medium | Low |
| Multi-organization / tenant support | Low | Very High |
| Mobile-responsive PWA | Low | High |

---

*This document is the authoritative specification for v1.0. All architectural decisions are subject to review as implementation progresses.*