import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, format } from 'date-fns'
import { reportsApi } from '@/api/reports'
import { teamsApi } from '@/api/teams'
import type { Team } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, CalendarDays } from 'lucide-react'

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function NewReportPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamId, setTeamId] = useState('')
  const [pickedDate, setPickedDate] = useState(toInputDate(new Date()))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedDate = new Date(pickedDate + 'T12:00:00')
  const weekNumber = getISOWeek(selectedDate)
  const weekYear = getISOWeekYear(selectedDate)
  const weekStart = format(startOfISOWeek(selectedDate), 'MMM d')
  const weekEnd = format(endOfISOWeek(selectedDate), 'MMM d, yyyy')

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
      const report = await reportsApi.create({ teamId: Number(teamId), weekYear, weekNumber })
      navigate(`/reports/${report.id}`)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        const existing = await reportsApi.getMyReports()
        const match = existing.find((r) => r.weekNumber === weekNumber && r.weekYear === weekYear)
        if (match) { navigate(`/reports/${match.id}`); return }
      }
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(msg ?? 'Failed to create report')
      setSubmitting(false)
    }
  }

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

          <div className="space-y-2">
            <Label>Pick any day in the week</Label>
            <Input
              type="date"
              value={pickedDate}
              onChange={(e) => setPickedDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">Week {weekNumber} · {weekYear}</p>
              <p className="text-xs text-muted-foreground">{weekStart} – {weekEnd}</p>
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
