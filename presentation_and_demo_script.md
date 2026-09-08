# Weekly Report Generator & Team Dashboard — Scripts

Two scripts are included:
1. **Presentation script** (Google Slides talk track) — ~8–10 min
2. **Demo video script** (screen recording walkthrough) — ~10–12 min

Adjust bracketed placeholders `[...]` to match your actual implementation details, screenshots, and numbers.

---

## PART 1 — PRESENTATION SCRIPT

### Slide 1: Title
**Say:**
"Hi, I'm [Name]. This is my submission for the Weekly Report Generator and Team Dashboard assignment — a full-stack internal tool for teams to submit weekly reports and for managers to review, approve, and analyze them across the team."

---

### Slide 2: System Architecture Overview
**Say:**
"The system is a three-tier architecture. The frontend is built in React with Vite, using React Router for navigation and Redux Toolkit for state management. The backend is a Spring Boot REST API using Spring Security with JWT for stateless authentication, and Spring Data JPA over PostgreSQL. I also run Mailpit locally to test transactional emails like account activation, without needing a real mail provider."

**Show:** architecture diagram — boxes for React SPA → REST API (Spring Boot) → PostgreSQL, with Mailpit off to the side connected to the backend.

**Say:**
"Every request from the frontend carries a JWT issued at login. The backend validates the token and role on every protected endpoint, so access control isn't just enforced in the UI — it's enforced at the API layer, which matters because a team member should never be able to reach another team member's data even by hitting the API directly."

---

### Slide 3: Database Design
**Say:**
"The schema centers on five entities: Users, Roles, Projects, Reports, and Report Review History."

**Show:** ER diagram.

**Say:**
"A User has a Role — Team Member, Manager, or Admin. A Report belongs to one User and optionally references a Project. Because reports go through a correction cycle, I didn't want to just overwrite a report when it's edited — I needed to preserve history. So each Report has a status field — Draft, Submitted, Needs Correction, or Approved — and a related ReportVersion table that stores a snapshot of the report's content every time it's resubmitted after correction. That's what powers the version history view a manager can open on any report."

**Say (if implemented):**
"Review comments are stored in a separate ReviewComment table linked to a report and, optionally, to the specific version it was made against — so a manager reviewing report history can see exactly which comment applied to which version."

---

### Slide 4: Frontend Structure
**Say:**
"On the frontend, I kept a clear separation between three concerns: the personal report page where a team member creates and edits their own report, the report history page which is a read-only list view of past submissions and their statuses, and the team dashboard, which is manager-only and aggregates data across the whole team."

**Show:** folder structure screenshot (pages/reports, pages/dashboard, pages/admin, components/).

**Say:**
"Components are organized by domain rather than by type — so report-related components live together, dashboard widgets live together — which made it easier to keep the report form, which is fairly complex with its task-level table, self-contained and reusable across the create and edit flows."

---

### Slide 5: API Design & Role-Based Access
**Say:**
"The API follows REST conventions — reports, projects, and users each have their own resource endpoints, with pagination and filtering built into any endpoint that returns a list, like the team dashboard's report listing, which supports filtering by team member, project, date range, and status."

**Say:**
"Role enforcement happens at the controller level using method security — for example, the manager review endpoint is annotated to require the Manager or Admin role, and report-editing endpoints check that the authenticated user actually owns the report before allowing changes. A manager can update a report's status and comment, but the service layer explicitly blocks a manager from modifying the report's actual content fields — only the team member who owns it can do that."

---

### Slide 6: Review & Correction Workflow
**Say:**
"This was the core piece of the assignment. A report moves through four states: Draft, which is private to the team member; Submitted, which puts it on the manager's dashboard; Needs Correction, which happens when a manager requests changes with a comment; and Approved."

**Show:** state diagram (Draft → Submitted → [Approved | Needs Correction] → Submitted → ...).

**Say:**
"When a manager requests changes, the report becomes editable again for the team member, the comment is surfaced clearly on their report page, and resubmitting moves it back to Submitted for another pass. Every time that correction cycle happens, I snapshot the previous version before applying the edit, so nothing is lost — the manager can open the report and see each past version alongside the one currently under review."

---

### Slide 7: AI Chat Assistant
**Say:**
"As the good-to-have feature, I built an AI assistant for managers using the Gemini API with function calling. Rather than giving the model direct database access or stuffing raw report text into the prompt, I exposed a small set of typed tools — get reports for a week, get team compliance summary, get open blockers — that the model can call. It decides which tool to call based on the manager's question, I execute that call against the same repository layer the rest of the app uses, and the result goes back to the model to compose its final answer."

**Say:**
"This keeps the assistant grounded in real data instead of hallucinating report contents, and keeps role-based access consistent — the chat endpoint is manager-only, and the tools only expose what a manager is already allowed to see through the dashboard."

**Say (data privacy note):**
"One thing I'd flag: I'm using Gemini's free tier for this assignment, and Google's free tier uses request data to improve their products. In a production deployment, this would need to move to a paid tier or a provider with a data-processing agreement before sending real report content."

---

### Slide 8: Challenges & Solutions
**Say (pick 2–3 that are true for you, e.g.):**
- "Modeling version history without duplicating the whole schema — I solved this with a lightweight snapshot table rather than versioning every entity."
- "Keeping the tool-use loop for the AI assistant from running away — I capped it at a small number of iterations and made each tool call scoped and side-effect-free."
- "Making role checks consistent across dozens of endpoints — I centralized ownership checks in the service layer instead of repeating them in every controller method."

---

### Slide 9: Future Improvements
**Say:**
"Given more time, I'd add: a full diff view between report versions rather than a flat list, a one-click AI-generated weekly digest for managers instead of only conversational chat, email notifications when a report needs correction or is approved, and moving the AI integration to a paid tier with stricter data handling for production use."

---

### Slide 10: Thank You / Questions
**Say:**
"That's my submission — happy to walk through the code or answer questions."

---

## PART 2 — DEMO VIDEO SCRIPT

Keep camera on throughout per the assignment's requirement. Speak naturally, don't just read — this is a rough guide for pacing and coverage.

### Scene 1 — Intro (30 sec)
**Say:**
"Hi, I'm [Name], and this is a walkthrough of my Weekly Report Generator and Team Dashboard. I'll show it first as a team member, then as a manager, covering the full review and correction cycle."

---

### Scene 2 — Auth (1 min)
**Do:** Show the login page, then briefly show register/activation flow (mention Mailpit if you demo the activation email).

**Say:**
"Here's the login page. Registration goes through an activation email — I'm using Mailpit locally to catch that email during development, so I'll open it here and click through to activate the account. Sessions are handled with JWTs, and role is assigned at [signup / by an admin — say whichever you implemented]."

---

### Scene 3 — Team Member: Creating a Report (2–3 min)
**Do:** Log in as a team member. Navigate to the personal report page. Fill in a new weekly report.

**Say:**
"Now I'm logged in as [team member name], a team member. This is my personal report page. Every report has the same fixed structure — week, project tag, a task table with planned versus actual percentages and time, tasks planned for next week, blockers with the option to flag a key one, and achievements, same for a key highlight. I'll fill this in and save it as a draft first."

**Do:** Save as draft, show it appears in report history as Draft.

**Say:**
"Here's my report history page — separate from the edit page — showing this report as Draft. I can come back and keep editing it."

**Do:** Edit again, then submit.

**Say:**
"Now I'll submit it for review — status moves to Submitted, and it's no longer editable by me until a manager acts on it."

---

### Scene 4 — Manager: Reviewing & Requesting Changes (2 min)
**Do:** Log out, log in as a manager. Go to the team dashboard.

**Say:**
"Now I'm logged in as [manager name]. This is the team dashboard — I can filter by team member, project, date range, and status. I can see [team member]'s report just submitted."

**Do:** Open the report in the manager review page.

**Say:**
"Opening the report shows the full content, read-only for me as a manager — I can approve it or request changes with a comment. I'll request changes here and leave a comment."

**Do:** Submit "Request Changes" with a comment.

---

### Scene 5 — Team Member: Correcting & Resubmitting (1–2 min)
**Do:** Log back in as the team member.

**Say:**
"Back as [team member], the report now shows Needs Correction, with the manager's comment visible right on the page. I'll make the requested edit and resubmit."

**Do:** Edit and resubmit. Status returns to Submitted.

---

### Scene 6 — Manager: Approving & Version History (1–2 min)
**Do:** Log back in as manager, open the same report.

**Say:**
"Back as the manager, I can see this report has a version history now — here's the previous version before correction, alongside the current one, with the comment that was made against it. I'm satisfied with the changes now, so I'll approve it."

**Do:** Approve the report.

---

### Scene 7 — Multi-User Data (1–2 min)
**Do:** Show 2–3 different team members' reports on the dashboard or via their profile pages.

**Say:**
"To show this is genuinely multi-user, here are reports from two other team members — [Name] and [Name] — each with their own history and current status, filterable independently on the dashboard."

---

### Scene 8 — Dashboard & Visual Insights (1–2 min)
**Do:** Navigate to the analytics/insights view.

**Say:**
"This is the insights dashboard — submission compliance rate, open blockers count, reports currently needing correction, and charts for task completion trends, submission status by team member, workload by project, and time spent by task type across the team."

---

### Scene 9 — Projects / Admin (1 min)
**Do:** Show project CRUD page, and user management page if implemented.

**Say:**
"Here's project and category management — add, edit, delete — and [if implemented] the admin user management page for inviting team members and assigning roles."

---

### Scene 10 — AI Chat Assistant (1–2 min)
**Do:** Open the chat widget as a manager, ask a real question.

**Say:**
"Finally, the AI assistant. I'll ask: 'What blockers did the team report this week?' The assistant calls a tool behind the scenes to pull the actual blocker data from this week's reports rather than guessing, and answers based on that."

**Do:** Show the response. Optionally ask a second question (e.g., "Summarize the team's work this week").

---

### Scene 11 — Closing (20 sec)
**Say:**
"That covers the core flow — report creation, the full review and correction cycle with version history, the manager dashboard, and the AI assistant. Thanks for watching."

---

## Coverage Checklist (map back to assignment requirements)

- [ ] Login / Register / Activation
- [ ] Personal report page (create/edit, fixed structure, draft save)
- [ ] Report history page (per user)
- [ ] Submit → Needs Correction → edit → resubmit → Approve (full cycle)
- [ ] Report version history visible to manager
- [ ] Team dashboard with filters (member, project, date range, status)
- [ ] Report detail / view page
- [ ] Team member profile page (manager view), 2–3 different members shown
- [ ] Project/category management page
- [ ] User management page (if implemented)
- [ ] Summary metrics + charts
- [ ] AI Chat Assistant demo
- [ ] Face visible on camera throughout
