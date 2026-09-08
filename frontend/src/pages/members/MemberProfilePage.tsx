import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usersApi } from '@/api/users'
import { dashboardApi } from '@/api/dashboard'
import { reportsApi } from '@/api/reports'
import type { User, UserStats, WeeklyReportSummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { STATUS_CHART_COLORS, MOOD_CHART_COLORS } from '@/lib/chartColors'
import {
  ArrowLeft, FileText, CheckCircle2, TrendingUp, Clock, Users,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const MOOD_LABELS: Record<string, string> = {
  GREAT: '😄 Great',
  GOOD: '🙂 Good',
  NEUTRAL: '😐 Neutral',
  DIFFICULT: '😟 Difficult',
  BURNED_OUT: '😩 Burned out',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekKey(r: WeeklyReportSummary) {
  return `W${r.weekNumber}/${r.weekYear}`
}

function weekSort(a: string, b: string) {
  // "W37/2026" → compare year then week
  const [wa, ya] = a.slice(1).split('/').map(Number)
  const [wb, yb] = b.slice(1).split('/').map(Number)
  return ya !== yb ? ya - yb : wa - wb
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

function roleLabel(role: string) {
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MemberProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [reports, setReports] = useState<WeeklyReportSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const uid = Number(userId)

    Promise.allSettled([
      usersApi.getById(uid),
      dashboardApi.getUserStats(uid),
      reportsApi.getAll({ authorId: uid, status: 'SUBMITTED', size: 200 }),
      reportsApi.getAll({ authorId: uid, status: 'APPROVED', size: 200 }),
    ]).then(([userRes, statsRes, submittedRes, approvedRes]) => {
      if (userRes.status === 'fulfilled') setUser(userRes.value)
      if (statsRes.status === 'fulfilled') setStats(statsRes.value)

      const combined: WeeklyReportSummary[] = [
        ...(submittedRes.status === 'fulfilled' ? submittedRes.value.content : []),
        ...(approvedRes.status === 'fulfilled' ? approvedRes.value.content : []),
      ]
      setReports(combined)
    }).finally(() => setLoading(false))
  }, [userId])

  // ── Derived: submission trend ──────────────────────────────────────────────

  const weekGroups: Record<string, WeeklyReportSummary[]> = {}
  reports.forEach((r) => {
    const k = weekKey(r)
    if (!weekGroups[k]) weekGroups[k] = []
    weekGroups[k].push(r)
  })
  const allWeeks = Object.keys(weekGroups).sort(weekSort)
  const last12 = allWeeks.slice(-12)
  const submissionTrend = last12.map((k) => ({
    week: k,
    count: weekGroups[k].length,
  }))

  // ── Derived: mood distribution ────────────────────────────────────────────

  const moodChartData = stats
    ? Object.entries(stats.moodBreakdown)
        .filter(([, v]) => v > 0)
        .map(([mood, count]) => ({ mood, label: MOOD_LABELS[mood] ?? mood, count }))
    : []

  // ── Derived: sorted reports table ─────────────────────────────────────────

  const sortedReports = [...reports].sort(
    (a, b) => b.weekYear !== a.weekYear
      ? b.weekYear - a.weekYear
      : b.weekNumber - a.weekNumber
  )

  // ── KPI values ────────────────────────────────────────────────────────────

  const totalReports = stats?.totalReports ?? reports.length
  const approvedCount = stats?.approvedReports ?? reports.filter((r) => r.status === 'APPROVED').length
  const approvalRate = stats?.approvalRate != null
    ? Math.round(stats.approvalRate)
    : totalReports > 0
      ? Math.round((approvedCount / totalReports) * 100)
      : 0
  const avgHours = stats?.averageHoursPerWeek ?? 0

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  // ── Empty / not found ─────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground mt-20">
        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Member not found</p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header: avatar + identity */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-border text-xl font-semibold shrink-0">
          {initials(user.firstName, user.lastName)}
        </div>
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-bold leading-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {user.roles.map((role) => (
              <Badge key={role} variant="secondary">{roleLabel(role)}</Badge>
            ))}
            {user.department && (
              <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                {user.department}
              </span>
            )}
            {user.jobTitle && (
              <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                {user.jobTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Total Reports */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Reports</p>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">{totalReports}</p>
        </Card>

        {/* Approved */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved</p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">
            {approvedCount}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ {totalReports}</span>
          </p>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground transition-all"
              style={{ width: `${totalReports > 0 ? Math.min(Math.round((approvedCount / totalReports) * 100), 100) : 0}%` }}
            />
          </div>
        </Card>

        {/* Approval Rate */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approval Rate</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">{approvalRate}%</p>
          <p className="text-xs text-muted-foreground">all time</p>
        </Card>

        {/* Avg Hours */}
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Hours</p>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">{avgHours > 0 ? `${avgHours}h` : '—'}</p>
          <p className="text-xs text-muted-foreground">per week</p>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Submissions over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Submissions over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {submissionTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={submissionTrend}>
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={STATUS_CHART_COLORS.SUBMITTED}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Reports"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        {moodChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mood Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={moodChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    tickFormatter={(v: string) => v.split(' ').slice(1).join(' ')}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => [value, 'Reports']}
                    labelFormatter={(label) => String(label)}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {moodChartData.map((entry) => (
                      <Cell key={entry.mood} fill={MOOD_CHART_COLORS[entry.mood] ?? '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reports history table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No submitted or approved reports yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedReports.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(
                        r.status === 'SUBMITTED'
                          ? `/reports/${r.id}/review`
                          : `/reports/${r.id}`
                      )
                    }
                  >
                    <TableCell className="text-muted-foreground text-sm font-medium">
                      W{r.weekNumber}/{r.weekYear}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.submittedAt
                        ? format(new Date(r.submittedAt), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
