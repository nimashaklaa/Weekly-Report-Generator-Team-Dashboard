// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  roles: string[]
  department?: string
  jobTitle?: string
  accountLocked: boolean
  enabled: boolean
}

export interface AuthResponse {
  accessToken: string
  user: User
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED'
export type MoodType = 'GREAT' | 'GOOD' | 'NEUTRAL' | 'DIFFICULT' | 'BURNED_OUT'
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CARRIED_OVER' | 'BLOCKED'
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ReportTask {
  id: number
  title: string
  description?: string
  status: TaskStatus
  priority?: TaskPriority
  hoursSpent: number
  projectId?: number
  projectName?: string
  categoryId?: number
  categoryName?: string
  sortOrder: number
  outputDeliverable?: string
}

export interface HoursBreakdown {
  meetingHours: number
  deepWorkHours: number
  adminHours: number
  reviewHours: number
  otherHours: number
  totalHours: number
}

export interface ReportComment {
  id: number
  body: string
  authorId: number
  authorName: string
  correctionRequest: boolean
  versionNumber?: number
  createdDate: string
}

export interface ReportVersion {
  id: number
  versionNumber: number
  createdDate: string
}

export interface WeeklyReport {
  id: number
  authorId: number
  authorName: string
  reviewerId?: number
  reviewerName?: string
  teamId?: number
  teamName?: string
  weekYear: number
  weekNumber: number
  status: ReportStatus
  weekSummary?: string
  overallMood?: MoodType
  blockers?: string
  nextWeekPlan?: string
  generalNotes?: string
  currentVersion: number
  submittedAt?: string
  reviewedAt?: string
  createdDate?: string
  tasks: ReportTask[]
  hoursBreakdown?: HoursBreakdown
  comments?: ReportComment[]
}

export interface WeeklyReportSummary {
  id: number
  weekYear: number
  weekNumber: number
  status: ReportStatus
  overallMood?: MoodType
  currentVersion: number
  submittedAt?: string
  createdDate?: string
  authorId: number
  authorName: string
  teamId?: number
  teamName?: string
}

// ─── Teams ────────────────────────────────────────────────────────────────────
export interface Team {
  id: number
  name: string
  description?: string
  manager: User
  members: User[]
  active: boolean
  memberCount: number
}

// ─── Projects & Categories ────────────────────────────────────────────────────
export interface Project {
  id: number
  name: string
  description?: string
  colorHex?: string
  active: boolean
}

export interface Category {
  id: number
  name: string
  description?: string
  colorHex?: string
  active: boolean
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType = 'REPORT_SUBMITTED' | 'REPORT_APPROVED' | 'REPORT_NEEDS_CORRECTION' | 'SYSTEM'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message?: string
  isRead: boolean
  readAt?: string
  createdDate: string
  relatedReportId?: number
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface ReportStatusBreakdown {
  draft: number
  submitted: number
  needsCorrection: number
  approved: number
  total: number
}

export interface DashboardSummary {
  totalUsers: number
  totalTeams: number
  totalActiveProjects: number
  currentWeekYear: number
  currentWeekNumber: number
  reportsThisWeek: ReportStatusBreakdown
  pendingReviews: number
}

export interface TeamReportStats {
  teamId: number
  teamName: string
  weekYear: number
  weekNumber: number
  totalMembers: number
  submittedCount: number
  submissionRate: number
  statusBreakdown: ReportStatusBreakdown
  missingMembers: string[]
}

export interface UserStats {
  userId: number
  fullName: string
  email: string
  totalReports: number
  approvedReports: number
  submittedReports: number
  needsCorrectionReports: number
  approvalRate: number
  moodBreakdown: Record<string, number>
  averageHoursPerWeek: number
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  last: boolean
}
