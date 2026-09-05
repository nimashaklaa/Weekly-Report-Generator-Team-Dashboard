import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { dashboardApi } from '@/api/dashboard'
import { reportsApi } from '@/api/reports'
import type { UserStats, WeeklyReportSummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const MOOD_COLORS: Record<string, string> = {
  GREAT: '#22c55e', GOOD: '#84cc16', NEUTRAL: '#facc15',
  DIFFICULT: '#f97316', BURNED_OUT: '#ef4444',
}

export default function PersonalDashboard() {
  const user = useAppSelector((s) => s.auth.user)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [reports, setReports] = useState<WeeklyReportSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      dashboardApi.getUserStats(user.id),
      reportsApi.getMyReports(),
    ]).then(([s, r]) => { setStats(s); setReports(r) })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    </div>
  )

  const moodData = stats
    ? Object.entries(stats.moodBreakdown)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : []

  const weeklyHours = reports
    .filter((r) => r.totalHours)
    .slice(-8)
    .map((r) => ({ week: `W${r.weekNumber}`, hours: r.totalHours ?? 0 }))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Hello, {user?.firstName}. Here's your activity overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Reports</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.totalReports ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{stats?.approvedReports ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approval Rate</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.approvalRate ?? 0}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Hours/Week</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats?.averageHoursPerWeek ?? 0}h</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours trend */}
        <Card>
          <CardHeader><CardTitle>Weekly Hours Trend</CardTitle></CardHeader>
          <CardContent>
            {weeklyHours.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyHours}>
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Mood breakdown */}
        <Card>
          <CardHeader><CardTitle>Mood Distribution</CardTitle></CardHeader>
          <CardContent>
            {moodData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No mood data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {moodData.map((entry) => (
                      <Cell key={entry.name} fill={MOOD_COLORS[entry.name] ?? '#94a3b8'} />
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
