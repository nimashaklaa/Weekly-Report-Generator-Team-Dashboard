import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { dashboardApi } from '@/api/dashboard'
import { reportsApi } from '@/api/reports'
import type { UserStats, WeeklyReportSummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { MOOD_CHART_COLORS } from '@/lib/chartColors'
import { FileText, CheckCircle2, TrendingUp, Clock } from 'lucide-react'

export default function PersonalDashboard() {
  const user = useAppSelector((s) => s.auth.user)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [reports, setReports] = useState<WeeklyReportSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.allSettled([
      dashboardApi.getUserStats(user.id),
      reportsApi.getMyReports(),
    ]).then(([statsResult, reportsResult]) => {
      if (statsResult.status === 'fulfilled') setStats(statsResult.value)
      if (reportsResult.status === 'fulfilled') setReports(reportsResult.value)
    }).finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    </div>
  )

  const moodData = stats
    ? Object.entries(stats.moodBreakdown)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : []

  const weeklyHours = reports
    .slice(-8)
    .map((r) => ({
      week: `W${r.weekNumber}`,
      hours: r.totalHours ?? 0,
      count: 1,
    }))

  const hasHoursData = weeklyHours.some((d) => d.hours > 0)
  const hasAnyReports = weeklyHours.length > 0

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground text-sm">{user?.firstName} {user?.lastName}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reports</p>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">{stats?.totalReports ?? 0}</p>
        </Card>

        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved</p>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">
            {stats?.approvedReports ?? 0}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ {stats?.totalReports ?? 0}</span>
          </p>
          {stats && stats.totalReports > 0 && (
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${Math.min(stats.approvalRate, 100)}%` }}
              />
            </div>
          )}
        </Card>

        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approval Rate</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">{stats?.approvalRate ?? 0}%</p>
          <p className="text-xs text-muted-foreground">all time</p>
        </Card>

        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Hours</p>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-semibold">{stats?.averageHoursPerWeek ?? 0}h</p>
          <p className="text-xs text-muted-foreground">per week</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{hasHoursData ? 'Weekly Hours Trend' : 'Reports per Week'}</CardTitle></CardHeader>
          <CardContent>
            {!hasAnyReports ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            ) : hasHoursData ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyHours}>
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}h`, 'Hours']} />
                  <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyHours}>
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [v, 'Reports']} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Mood breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Mood Distribution</CardTitle></CardHeader>
          <CardContent>
            {moodData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No mood data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {moodData.map((entry) => (
                      <Cell key={entry.name} fill={MOOD_CHART_COLORS[entry.name] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
