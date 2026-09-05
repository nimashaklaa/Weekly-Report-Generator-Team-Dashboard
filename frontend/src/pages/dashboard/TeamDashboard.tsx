import { useEffect, useState } from 'react'
import { dashboardApi } from '@/api/dashboard'
import { teamsApi } from '@/api/teams'
import { reportsApi } from '@/api/reports'
import type { DashboardSummary, Team, WeeklyReportSummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

export default function TeamDashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [reports, setReports] = useState<WeeklyReportSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardApi.getSummary(),
      teamsApi.getAll({ activeOnly: true }),
    ]).then(([s, t]) => {
      setSummary(s)
      setTeams(t.content)
      if (t.content.length > 0) setSelectedTeamId(String(t.content[0].id))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedTeamId) return
    reportsApi.getAll({ teamId: Number(selectedTeamId), size: 50 }).then((p) => setReports(p.content))
  }, [selectedTeamId])

  const statusChartData = summary ? [
    { name: 'Draft', count: summary.reportsThisWeek.draft, color: '#94a3b8' },
    { name: 'Submitted', count: summary.reportsThisWeek.submitted, color: '#3b82f6' },
    { name: 'Needs Correction', count: summary.reportsThisWeek.needsCorrection, color: '#f97316' },
    { name: 'Approved', count: summary.reportsThisWeek.approved, color: '#22c55e' },
  ] : []

  if (loading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Week {summary?.currentWeekNumber}, {summary?.currentWeekYear}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{summary?.totalUsers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Teams</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{summary?.totalTeams}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Reviews</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-orange-500">{summary?.pendingReviews}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Reports This Week</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{summary?.reportsThisWeek.total}</p></CardContent>
        </Card>
      </div>

      {/* Status chart */}
      <Card>
        <CardHeader><CardTitle>This Week — Report Status Breakdown</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team report table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Reports</CardTitle>
            <Select value={selectedTeamId} onValueChange={(v) => setSelectedTeamId(v ?? '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/reports/${r.id}`)}
                  >
                    <TableCell className="font-medium">{r.authorName}</TableCell>
                    <TableCell>W{r.weekNumber} / {r.weekYear}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      {r.submittedAt ? format(new Date(r.submittedAt), 'MMM d') : '—'}
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
