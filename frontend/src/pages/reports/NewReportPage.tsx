import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getISOWeek, getISOWeekYear } from 'date-fns'
import { reportsApi } from '@/api/reports'
import { teamsApi } from '@/api/teams'
import type { Team } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default function NewReportPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamId, setTeamId] = useState('')
  const [weekNumber, setWeekNumber] = useState(getISOWeek(new Date()))
  const [weekYear, setWeekYear] = useState(getISOWeekYear(new Date()))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    teamsApi.getAll({ activeOnly: true }).then((p) => {
      setTeams(p.content)
      if (p.content.length > 0) setTeamId(String(p.content[0].id))
    })
  }, [])

  const handleCreate = async () => {
    if (!teamId) { setError('Please select a team'); return }
    setSubmitting(true)
    setError('')
    try {
      const report = await reportsApi.create({
        teamId: Number(teamId),
        weekYear,
        weekNumber,
      })
      navigate(`/reports/${report.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(msg ?? 'Failed to create report')
      setSubmitting(false)
    }
  }

  const weeks = Array.from({ length: 53 }, (_, i) => i + 1)
  const years = [weekYear - 1, weekYear, weekYear + 1]

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Report</h1>
          <p className="text-sm text-muted-foreground">Create a weekly report</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Report Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Team</Label>
            <Select value={teamId} onValueChange={(v) => setTeamId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select your team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Week</Label>
              <Select value={String(weekNumber)} onValueChange={(v) => setWeekNumber(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((w) => (
                    <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={String(weekYear)} onValueChange={(v) => setWeekYear(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleCreate} disabled={submitting || !teamId}>
            {submitting ? 'Creating…' : 'Create Report'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
