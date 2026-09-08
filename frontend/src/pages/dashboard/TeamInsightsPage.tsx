import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { teamsApi } from '@/api/teams'
import { reportsApi } from '@/api/reports'
import type { Team, WeeklyReportSummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { MOOD_CHART_COLORS, STATUS_CHART_COLORS } from '@/lib/chartColors'
import { Users, TrendingUp, FileCheck2, Clock } from 'lucide-react'
import StatusBadge from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const MOOD_LABELS: Record<string, string> = {
  GREAT: '😄 Great', GOOD: '🙂 Good', NEUTRAL: '😐 Neutral',
  DIFFICULT: '😟 Difficult', BURNED_OUT: '😩 Burned out',
}

function weekKey(r: WeeklyReportSummary) {
  return `W${r.weekNumber}/${r.weekYear}`
}

function weekSort(a: string, b: string) {
  // "W37/2026" → compare year then week
  const [wa, ya] = a.slice(1).split('/').map(Number)
  const [wb, yb] = b.slice(1).split('/').map(Number)
  return ya !== yb ? ya - yb : wa - wb
}

export default function TeamInsightsPage() {
  const navigate = useNavigate()
  const currentUser = useAppSelector((s) => s.auth.user)

  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [reports, setReports] = useState<WeeklyReportSummary[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingReports, setLoadingReports] = useState(false)

  // Load managed teams
  useEffect(() => {
    if (!currentUser) return
    teamsApi.getAll({ activeOnly: true, managerId: currentUser.id }).then((p) => {
      setTeams(p.content)
      if (p.content.length > 0) setSelectedTeamId(p.content[0].id)
    }).finally(() => setLoadingTeams(false))
  }, [currentUser])

  // Load reports whenever team changes
  useEffect(() => {
    if (!selectedTeamId) return
    setLoadingReports(true)
    Promise.all([
      reportsApi.getAll({ teamId: selectedTeamId, status: 'SUBMITTED', size: 300 }),
      reportsApi.getAll({ teamId: selectedTeamId, status: 'APPROVED',  size: 300 }),
    ]).then(([s, a]) => {
      setReports([...s.content, ...a.content])
    }).finally(() => setLoadingReports(false))
  }, [selectedTeamId])

  const team = teams.find((t) => t.id === selectedTeamId) ?? null

  // ── Derived data ──────────────────────────────────────────────────────────

  // Weekly submission trend (last 12 weeks, sorted)
  const weekGroups: Record<string, WeeklyReportSummary[]> = {}
  reports.forEach((r) => {
    const k = weekKey(r)
    if (!weekGroups[k]) weekGroups[k] = []
    weekGroups[k].push(r)
  })
  const allWeeks = Object.keys(weekGroups).sort(weekSort)
  const last12 = allWeeks.slice(-12)

  const submissionTrend = last12.map((k) => {
    const wrs = weekGroups[k]
    const totalHours = wrs.reduce((s, r) => s + (r.totalHours ?? 0), 0)
    const avgHours = wrs.length > 0 ? +(totalHours / wrs.length).toFixed(1) : 0
    return { week: k, submissions: wrs.length, avgHours }
  })

  // Mood trend per week
  const moodTrend = last12.map((k) => {
    const wrs = weekGroups[k]
    const entry: Record<string, number | string> = { week: k }
    wrs.forEach((r) => {
      if (r.overallMood) entry[r.overallMood] = ((entry[r.overallMood] as number) || 0) + 1
    })
    return entry
  })
  const moodKeys = ['GREAT', 'GOOD', 'NEUTRAL', 'DIFFICULT', 'BURNED_OUT'].filter((m) =>
    moodTrend.some((d) => (d[m] as number) > 0)
  )

  // Per-member summary
  const memberMap: Record<string, { authorId: number; name: string; reports: WeeklyReportSummary[] }> = {}
  reports.forEach((r) => {
    if (!memberMap[r.authorId]) memberMap[r.authorId] = { authorId: r.authorId, name: r.authorName, reports: [] }
    memberMap[r.authorId].reports.push(r)
  })
  const members = Object.values(memberMap).map(({ authorId, name, reports: mrs }) => {
    const sorted = [...mrs].sort(
      (a, b) => (b.weekYear * 100 + b.weekNumber) - (a.weekYear * 100 + a.weekNumber)
    )
    const totalH = mrs.reduce((s, r) => s + (r.totalHours ?? 0), 0)
    const withHours = mrs.filter((r) => r.totalHours)
    const avgHours = withHours.length > 0 ? +(totalH / withHours.length).toFixed(1) : null
    const lastReport = sorted[0]
    const moodCounts: Record<string, number> = {}
    mrs.forEach((r) => { if (r.overallMood) moodCounts[r.overallMood] = (moodCounts[r.overallMood] || 0) + 1 })
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return { authorId, name, count: mrs.length, avgHours, lastReport, topMood }
  }).sort((a, b) => b.count - a.count)

  // Overall KPIs
  const totalSubmitted = reports.length
  const approved = reports.filter((r) => r.status === 'APPROVED').length
  const approvalRate = totalSubmitted > 0 ? Math.round((approved / totalSubmitted) * 100) : 0
  const hoursReports = reports.filter((r) => r.totalHours)
  const avgTeamHours = hoursReports.length > 0
    ? +(hoursReports.reduce((s, r) => s + (r.totalHours ?? 0), 0) / hoursReports.length).toFixed(1)
    : null

  const loading = loadingTeams || loadingReports

  if (loadingTeams) return (
    <div className="p-4 sm:p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    </div>
  )

  if (teams.length === 0) return (
    <div className="p-6 text-center text-muted-foreground mt-20">
      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="font-medium">No teams assigned</p>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Insights</h1>
          <p className="text-sm text-muted-foreground">Historical output from submitted & approved reports</p>
        </div>
        {teams.length > 1 && (
          <Select
            value={String(selectedTeamId)}
            onValueChange={(v) => setSelectedTeamId(Number(v))}
          >
            <SelectTrigger className="w-52">
              <SelectValue>{team?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loadingReports ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <FileCheck2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No submitted or approved reports yet</p>
          <p className="text-sm">Data will appear once team members start submitting.</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Reports</p>
                <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold">{totalSubmitted}</p>
              <p className="text-xs text-muted-foreground">submitted + approved</p>
            </Card>

            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approved</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold">
                {approved}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ {totalSubmitted}</span>
              </p>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${approvalRate}%` }} />
              </div>
            </Card>

            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approval Rate</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold">{approvalRate}%</p>
              <p className="text-xs text-muted-foreground">all time</p>
            </Card>

            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Hours</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold">{avgTeamHours != null ? `${avgTeamHours}h` : '—'}</p>
              <p className="text-xs text-muted-foreground">per report</p>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Submissions per week */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Submissions per Week</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={submissionTrend}>
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke={STATUS_CHART_COLORS.SUBMITTED}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Submissions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Avg hours per week */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Avg Hours per Week</CardTitle></CardHeader>
              <CardContent>
                {submissionTrend.every((d) => d.avgHours === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No hours data recorded</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={submissionTrend}>
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} width={28} />
                      <Tooltip formatter={(v) => [`${v}h`, 'Avg hours']} />
                      <Line
                        type="monotone"
                        dataKey="avgHours"
                        stroke={STATUS_CHART_COLORS.APPROVED}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Avg Hours"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mood trend */}
          {moodKeys.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Team Mood Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={moodTrend}>
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                    <Tooltip />
                    <Legend formatter={(v) => MOOD_LABELS[v]?.split(' ').slice(1).join(' ') ?? v} />
                    {moodKeys.map((mood) => (
                      <Bar key={mood} dataKey={mood} stackId="mood" fill={MOOD_CHART_COLORS[mood]} radius={mood === moodKeys[moodKeys.length - 1] ? [4, 4, 0, 0] : undefined}>
                        {moodTrend.map((_, i) => <Cell key={i} fill={MOOD_CHART_COLORS[mood]} />)}
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Member breakdown table */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Member Activity</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Member</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Reports</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Avg Hours</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Mood</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Last Report</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(({ authorId, name, count, avgHours, lastReport, topMood }) => (
                      <tr
                        key={name}
                        className="border-b last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                        onClick={() => navigate(`/members/${authorId}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-border text-xs font-medium shrink-0">
                              {name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                            </span>
                            <span className="font-medium truncate">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{count}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {avgHours != null ? `${avgHours}h` : '—'}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {topMood ? (
                            <span className="text-xs">{MOOD_LABELS[topMood]}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          <span>W{lastReport.weekNumber}/{lastReport.weekYear}</span>
                          {lastReport.submittedAt && (
                            <span className="hidden sm:inline text-muted-foreground/60 ml-1">
                              · {format(new Date(lastReport.submittedAt), 'MMM d')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lastReport.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent reports feed */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Recent Reports</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Member</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Week</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Hours</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Mood</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...reports]
                      .sort((a, b) => (b.weekYear * 100 + b.weekNumber) - (a.weekYear * 100 + a.weekNumber))
                      .slice(0, 20)
                      .map((r) => (
                        <tr
                          key={r.id}
                          className="border-b last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                          onClick={() => navigate(r.status === 'SUBMITTED' ? `/reports/${r.id}/review` : `/reports/${r.id}`)}
                        >
                          <td
                            className="px-4 py-2.5 font-medium hover:underline"
                            onClick={(e) => { e.stopPropagation(); navigate(`/members/${r.authorId}`) }}
                          >{r.authorName}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">W{r.weekNumber}/{r.weekYear}</td>
                          <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">
                            {r.totalHours != null ? `${r.totalHours}h` : '—'}
                          </td>
                          <td className="px-4 py-2.5 hidden sm:table-cell text-xs">
                            {r.overallMood ? MOOD_LABELS[r.overallMood] : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
