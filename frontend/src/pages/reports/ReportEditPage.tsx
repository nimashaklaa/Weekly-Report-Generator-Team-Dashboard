import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { reportsApi } from '@/api/reports'
import type { WeeklyReport, ReportTask } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

const MOODS = [
  { value: 'GREAT', label: '😄 Great' },
  { value: 'GOOD', label: '🙂 Good' },
  { value: 'NEUTRAL', label: '😐 Neutral' },
  { value: 'DIFFICULT', label: '😟 Difficult' },
  { value: 'BURNED_OUT', label: '😩 Burned out' },
]

const TASK_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CARRIED_OVER', 'BLOCKED']
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']

interface TaskRow {
  key: number
  title: string
  description: string
  status: string
  priority: string
  hoursSpent: string
}

interface Hours {
  meetingHours: string
  deepWorkHours: string
  adminHours: string
  reviewHours: string
  otherHours: string
}

let taskKey = 0
const newTask = (): TaskRow => ({
  key: ++taskKey,
  title: '',
  description: '',
  status: 'IN_PROGRESS',
  priority: 'MEDIUM',
  hoursSpent: '0',
})

export default function ReportEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const reportId = Number(id)

  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [weekSummary, setWeekSummary] = useState('')
  const [mood, setMood] = useState('')
  const [blockers, setBlockers] = useState('')
  const [nextWeekPlan, setNextWeekPlan] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [tasks, setTasks] = useState<TaskRow[]>([newTask()])
  const [hours, setHours] = useState<Hours>({
    meetingHours: '0',
    deepWorkHours: '0',
    adminHours: '0',
    reviewHours: '0',
    otherHours: '0',
  })

  useEffect(() => {
    reportsApi.getById(reportId).then((r) => {
      setReport(r)
      setWeekSummary(r.weekSummary ?? '')
      setMood(r.overallMood ?? '')
      setBlockers(r.blockers ?? '')
      setNextWeekPlan(r.nextWeekPlan ?? '')
      setGeneralNotes(r.generalNotes ?? '')
      if (r.tasks?.length > 0) {
        setTasks(r.tasks.map((t: ReportTask) => ({
          key: ++taskKey,
          title: t.title,
          description: t.description ?? '',
          status: t.status,
          priority: t.priority ?? 'MEDIUM',
          hoursSpent: String(t.hoursSpent ?? 0),
        })))
      }
      if (r.hoursBreakdown) {
        setHours({
          meetingHours: String(r.hoursBreakdown.meetingHours ?? 0),
          deepWorkHours: String(r.hoursBreakdown.deepWorkHours ?? 0),
          adminHours: String(r.hoursBreakdown.adminHours ?? 0),
          reviewHours: String(r.hoursBreakdown.reviewHours ?? 0),
          otherHours: String(r.hoursBreakdown.otherHours ?? 0),
        })
      }
    }).finally(() => setLoading(false))
  }, [reportId])

  const totalHours = Object.values(hours).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)

  const updateTask = (key: number, field: keyof TaskRow, value: string) => {
    setTasks((prev) => prev.map((t) => t.key === key ? { ...t, [field]: value } : t))
  }

  const removeTask = (key: number) => {
    setTasks((prev) => prev.filter((t) => t.key !== key))
  }

  const handleSave = async () => {
    if (!report) return
    const validTasks = tasks.filter((t) => t.title.trim())
    if (validTasks.length === 0) {
      setError('Add at least one task with a title before saving.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await reportsApi.update(reportId, {
        teamId: report.teamId!,
        weekYear: report.weekYear,
        weekNumber: report.weekNumber,
        weekSummary: weekSummary || undefined,
        overallMood: mood || undefined,
        blockers: blockers || undefined,
        nextWeekPlan: nextWeekPlan || undefined,
        generalNotes: generalNotes || undefined,
        tasks: validTasks.map((t, i) => ({
          title: t.title.trim(),
          description: t.description || undefined,
          status: t.status,
          priority: t.priority,
          hoursSpent: parseFloat(t.hoursSpent) || 0,
          sortOrder: i,
        })),
        hoursBreakdown: {
          meetingHours: parseFloat(hours.meetingHours) || 0,
          deepWorkHours: parseFloat(hours.deepWorkHours) || 0,
          adminHours: parseFloat(hours.adminHours) || 0,
          reviewHours: parseFloat(hours.reviewHours) || 0,
          otherHours: parseFloat(hours.otherHours) || 0,
        },
      })
      navigate(`/reports/${reportId}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      setError(msg ?? 'Failed to save report')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
    </div>
  )

  if (!report) return <div className="p-6 text-center text-muted-foreground">Report not found</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/reports/${reportId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Report</h1>
          <p className="text-sm text-muted-foreground">
            Week {report.weekNumber}, {report.weekYear} · {report.teamName}
          </p>
        </div>
      </div>

      {/* Summary & Mood */}
      <Card>
        <CardHeader><CardTitle>Week Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Week Summary</Label>
            <Textarea
              placeholder="What did you accomplish this week? Key highlights, achievements…"
              rows={4}
              value={weekSummary}
              onChange={(e) => setWeekSummary(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Overall Mood</Label>
            <Select value={mood} onValueChange={(v) => setMood(v ?? '')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="How was your week?" />
              </SelectTrigger>
              <SelectContent>
                {MOODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks <span className="text-muted-foreground text-sm font-normal">({tasks.length})</span></CardTitle>
            <Button size="sm" variant="outline" onClick={() => setTasks((p) => [...p, newTask()])}>
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            List the tasks / tickets you worked on this week. At least one is required to submit.
          </p>
          {tasks.map((task) => (
            <div key={task.key} className="border rounded-lg p-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Task title (e.g. Fixed login bug, Reviewed PR #42)"
                  value={task.title}
                  onChange={(e) => updateTask(task.key, 'title', e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTask(task.key)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Description (optional)"
                value={task.description}
                onChange={(e) => updateTask(task.key, 'description', e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2">
                <Select value={task.status} onValueChange={(v) => updateTask(task.key, 'status', v ?? task.status)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={task.priority} onValueChange={(v) => updateTask(task.key, 'priority', v ?? task.priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Hours"
                    value={task.hoursSpent}
                    onChange={(e) => updateTask(task.key, 'hoursSpent', e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground shrink-0">hrs</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hours Breakdown */}
      <Card>
        <CardHeader><CardTitle>Hours Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(Object.keys(hours) as (keyof Hours)[]).map((key) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs capitalize">
                  {key.replace('Hours', '').replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hours[key]}
                    onChange={(e) => setHours((p) => ({ ...p, [key]: e.target.value }))}
                  />
                  <span className="text-sm text-muted-foreground">h</span>
                </div>
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">Total</Label>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockers & Plans */}
      <Card>
        <CardHeader><CardTitle>Blockers & Plans</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Blockers</Label>
            <Textarea
              placeholder="Any blockers or impediments you encountered…"
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Next Week Plan</Label>
            <Textarea
              placeholder="What are you planning to work on next week…"
              rows={2}
              value={nextWeekPlan}
              onChange={(e) => setNextWeekPlan(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>General Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              placeholder="Any other notes…"
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving…' : 'Save Report'}
        </Button>
        <Button variant="outline" onClick={() => navigate(`/reports/${reportId}`)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
