import { useEffect, useState } from 'react'
import { dashboardApi } from '@/api/dashboard'
import { teamsApi } from '@/api/teams'
import { reportsApi } from '@/api/reports'
import { useAppSelector } from '@/store/hooks'
import type { Team, TeamReportStats, WeeklyReportSummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, CheckCircle2, UserCheck } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { STATUS_CHART_COLORS } from '@/lib/chartColors'

interface TeamSection {
  team: Team
  stats: TeamReportStats | null
  reports: WeeklyReportSummary[]
}

export default function TeamDashboard() {
  const navigate = useNavigate()
  const currentUser = useAppSelector((s) => s.auth.user)

  const [sections, setSections] = useState<TeamSection[]>([])
  const [loading, setLoading] = useState(true)
  const [weekLabel, setWeekLabel] = useState('')

  useEffect(() => {
    if (!currentUser) return

    teamsApi.getAll({ activeOnly: true, managerId: currentUser.id }).then(async (p) => {
      const teams = p.content

      // Fetch stats + reports for every team in parallel
      const results = await Promise.all(
        teams.map(async (team) => {
          const [stats, submitted, needsCorrection, approved] = await Promise.allSettled([
            dashboardApi.getTeamStats(team.id),
            reportsApi.getAll({ teamId: team.id, status: 'SUBMITTED', size: 50 }),
            reportsApi.getAll({ teamId: team.id, status: 'NEEDS_CORRECTION', size: 50 }),
            reportsApi.getAll({ teamId: team.id, status: 'APPROVED', size: 50 }),
          ])

          const teamStats = stats.status === 'fulfilled' ? stats.value : null
          if (teamStats) {
            setWeekLabel(`Week ${teamStats.weekNumber}, ${teamStats.weekYear}`)
          }

          const reports = [
            ...(submitted.status === 'fulfilled' ? submitted.value.content : []),
            ...(needsCorrection.status === 'fulfilled' ? needsCorrection.value.content : []),
            ...(approved.status === 'fulfilled' ? approved.value.content : []),
          ]

          return { team, stats: teamStats, reports } as TeamSection
        })
      )

      setSections(results)
    }).finally(() => setLoading(false))
  }, [currentUser])

  if (loading) return (
    <div className="p-4 sm:p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-24" />)}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ))}
    </div>
  )

  if (sections.length === 0) return (
    <div className="p-6 text-center text-muted-foreground mt-20">
      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No teams assigned</p>
      <p className="text-sm">You are not managing any active teams.</p>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        {weekLabel && <p className="text-muted-foreground text-sm">{weekLabel}</p>}
      </div>

      {sections.map(({ team, stats, reports }) => {
        const chartData = [
          { name: 'Submitted',        status: 'SUBMITTED',        count: reports.filter((r) => r.status === 'SUBMITTED').length },
          { name: 'Needs Correction', status: 'NEEDS_CORRECTION', count: reports.filter((r) => r.status === 'NEEDS_CORRECTION').length },
          { name: 'Approved',         status: 'APPROVED',         count: reports.filter((r) => r.status === 'APPROVED').length },
        ].filter((d) => d.count > 0)

        return (
          <div key={team.id} className="space-y-4">
            {/* Team header */}
            <div className="flex items-center gap-3">
              <div className="h-1 w-6 rounded-full bg-primary" />
              <h2 className="text-lg font-semibold">{team.name}</h2>
              {team.description && (
                <span className="text-sm text-muted-foreground">{team.description}</span>
              )}
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total members */}
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Members</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold">{stats?.totalMembers ?? team.memberCount}</p>
              </Card>

              {/* Submitted */}
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Submitted</p>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold">
                  {stats?.submittedCount ?? 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {stats?.totalMembers ?? team.memberCount}
                  </span>
                </p>
                {stats && (
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${Math.min(stats.submissionRate, 100)}%` }}
                    />
                  </div>
                )}
              </Card>

              {/* Submission rate */}
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rate</p>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold">{stats?.submissionRate ?? 0}%</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </Card>

              {/* Pending review */}
              <Card className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Review</p>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-semibold">{stats?.statusBreakdown.submitted ?? 0}</p>
                <p className="text-xs text-muted-foreground">awaiting approval</p>
              </Card>
            </div>

            {/* Missing members */}
            {stats && stats.missingMembers.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-lg border bg-muted/40">
                <p className="text-sm text-muted-foreground shrink-0">
                  Not yet submitted:
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.missingMembers.map((name) => {
                    const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase()
                    return (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 text-sm text-foreground"
                        title={name}
                      >
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-border text-xs font-medium">
                          {initials}
                        </span>
                        <span className="hidden sm:inline">{name}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Status breakdown chart */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-sm">Status Breakdown</CardTitle></CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No reports yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.status]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Reports table */}
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-sm">Reports</CardTitle></CardHeader>
                <CardContent className="p-0">
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
                            No reports submitted yet
                          </TableCell>
                        </TableRow>
                      ) : reports.map((r) => (
                        <TableRow
                          key={r.id}
                          className="cursor-pointer"
                          onClick={() => navigate(r.status === 'SUBMITTED' ? `/reports/${r.id}/review` : `/reports/${r.id}`)}
                        >
                          <TableCell
                            className="font-medium hover:underline"
                            onClick={(e) => { e.stopPropagation(); navigate(`/members/${r.authorId}`) }}
                          >{r.authorName}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">W{r.weekNumber}/{r.weekYear}</TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          <TableCell className="text-sm">
                            {r.submittedAt ? format(new Date(r.submittedAt), 'MMM d') : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Divider between teams */}
            <div className="border-b" />
          </div>
        )
      })}
    </div>
  )
}
