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
import { Users, AlertCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

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
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-24" />)}
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
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        {weekLabel && <p className="text-muted-foreground text-sm">{weekLabel}</p>}
      </div>

      {sections.map(({ team, stats, reports }) => {
        const chartData = stats ? [
          { name: 'Submitted', count: stats.statusBreakdown.submitted, color: '#3b82f6' },
          { name: 'Needs Correction', count: stats.statusBreakdown.needsCorrection, color: '#f97316' },
          { name: 'Approved', count: stats.statusBreakdown.approved, color: '#22c55e' },
        ] : []

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.totalMembers ?? team.memberCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Submitted This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-500">{stats?.submittedCount ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Submission Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats?.submissionRate ?? 0}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Pending Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-500">
                    {stats?.statusBreakdown.submitted ?? 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Missing members alert */}
            {stats && stats.missingMembers.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    {stats.missingMembers.length} member{stats.missingMembers.length !== 1 ? 's' : ''} haven't submitted yet
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-6">
                  {stats.missingMembers.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Status breakdown chart */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-sm">Status Breakdown</CardTitle></CardHeader>
                <CardContent>
                  {chartData.every((d) => d.count === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No submissions yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
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
                          onClick={() => navigate(`/reports/${r.id}`)}
                        >
                          <TableCell className="font-medium">{r.authorName}</TableCell>
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
