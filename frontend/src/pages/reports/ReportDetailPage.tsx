import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { reportsApi } from '@/api/reports'
import type { WeeklyReport, ReportComment } from '@/types'
import { useAppSelector } from '@/store/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/shared/StatusBadge'
import { toast } from '@/components/ui/toast'

const MOOD_LABELS: Record<string, string> = {
  GREAT:      '😄 Great',
  GOOD:       '🙂 Good',
  NEUTRAL:    '😐 Neutral',
  DIFFICULT:  '😟 Difficult',
  BURNED_OUT: '😩 Burned out',
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [comments, setComments] = useState<ReportComment[]>([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [correctionComment, setCorrectionComment] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)

  const reportId = Number(id)
  const isManager = user?.roles?.includes('MANAGER') || user?.roles?.includes('ADMIN')
  const isAuthor = !user || report?.authorId === user?.id
  const canEdit = isAuthor && (report?.status === 'DRAFT' || report?.status === 'NEEDS_CORRECTION')
  const canSubmit = isAuthor && (report?.status === 'DRAFT' || report?.status === 'NEEDS_CORRECTION')
  const canApprove = isManager && report?.status === 'SUBMITTED'

  useEffect(() => {
    Promise.all([
      reportsApi.getById(reportId),
      reportsApi.getComments(reportId),
    ]).then(([r, c]) => { setReport(r); setComments(c) })
      .finally(() => setLoading(false))
  }, [reportId])

  const handleSubmit = async () => {
    if (!report) return
    const filledTasks = report.tasks?.filter((t) => t.title?.trim())
    if (!filledTasks || filledTasks.length === 0) {
      toast.add({
        title: 'Report is incomplete',
        description: 'Add at least one task with a title before submitting for review.',
        type: 'error',
      })
      return
    }
    setSubmitting(true)
    try {
      const updated = await reportsApi.submit(reportId)
      setReport(updated)
      toast.add({ title: 'Submitted for review', type: 'success' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.add({ title: 'Failed to submit', description: msg ?? 'Please try again.', type: 'error' })
    } finally { setSubmitting(false) }
  }

  const handleApprove = async () => {
    if (!report) return
    setSubmitting(true)
    try {
      const updated = await reportsApi.approve(reportId)
      setReport(updated)
      toast.add({ title: 'Report approved', type: 'success' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.add({ title: 'Failed to approve', description: msg ?? 'Please try again.', type: 'error' })
    } finally { setSubmitting(false) }
  }

  const handleRequestCorrection = async () => {
    if (!correctionComment.trim()) {
      toast.add({ title: 'Comment required', description: 'Describe what needs to be corrected.', type: 'warning' })
      return
    }
    setSubmitting(true)
    try {
      const updated = await reportsApi.requestCorrection(reportId, correctionComment)
      setReport(updated)
      setShowCorrection(false)
      setCorrectionComment('')
      const updatedComments = await reportsApi.getComments(reportId)
      setComments(updatedComments)
      toast.add({ title: 'Correction requested', type: 'success' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.add({ title: 'Failed to send correction', description: msg ?? 'Please try again.', type: 'error' })
    } finally { setSubmitting(false) }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const newComment = await reportsApi.addComment(reportId, comment)
      setComments((prev) => [...prev, newComment])
      setComment('')
      toast.add({ title: 'Comment posted', type: 'success' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.add({ title: 'Failed to post comment', description: msg ?? 'Please try again.', type: 'error' })
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!report) return <div className="p-6 text-center text-muted-foreground">Report not found</div>

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Week {report.weekNumber}, {report.weekYear}
          </h1>
          <p className="text-sm text-muted-foreground">
            {report.authorName}
            {report.submittedAt && ` · Submitted ${format(new Date(report.submittedAt), 'MMM d, yyyy')}`}
          </p>
        </div>
        <StatusBadge status={report.status} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {canEdit && (
          <Button variant="outline" onClick={() => navigate(`/reports/${reportId}/edit`)}>
            Edit Report
          </Button>
        )}
        {canSubmit && (
          <Button onClick={handleSubmit} disabled={submitting}>
            Submit for Review
          </Button>
        )}
        {canApprove && !showCorrection && (
          <>
            <Button onClick={handleApprove} disabled={submitting}>
              <CheckCircle className="h-4 w-4 mr-2" /> Approve
            </Button>
            <Button variant="outline" onClick={() => setShowCorrection(true)}>
              <AlertCircle className="h-4 w-4 mr-2" /> Request Correction
            </Button>
          </>
        )}
      </div>

      {showCorrection && (
        <Card>
          <CardHeader><CardTitle>Request Correction</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Describe what needs to be corrected…"
              value={correctionComment}
              onChange={(e) => setCorrectionComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleRequestCorrection} disabled={submitting || !correctionComment.trim()}>
                Send
              </Button>
              <Button variant="outline" onClick={() => setShowCorrection(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Week Overview</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Summary</p>
            {report.weekSummary?.trim()
              ? <p className="text-sm whitespace-pre-wrap">{report.weekSummary.trim()}</p>
              : <p className="text-sm text-muted-foreground italic">Not filled in</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Mood</p>
            {report.overallMood
              ? <p className="text-sm">{MOOD_LABELS[report.overallMood] ?? report.overallMood}</p>
              : <p className="text-sm text-muted-foreground italic">Not filled in</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Blockers</p>
            {report.blockers?.trim()
              ? <p className="text-sm whitespace-pre-wrap">{report.blockers.trim()}</p>
              : <p className="text-sm text-muted-foreground italic">Not filled in</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Next Week Plan</p>
            {report.nextWeekPlan?.trim()
              ? <p className="text-sm whitespace-pre-wrap">{report.nextWeekPlan.trim()}</p>
              : <p className="text-sm text-muted-foreground italic">Not filled in</p>}
          </div>
          {report.generalNotes?.trim() && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">General Notes</p>
              <p className="text-sm whitespace-pre-wrap">{report.generalNotes.trim()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader><CardTitle>Tasks <span className="text-muted-foreground text-sm font-normal">({report.tasks?.length ?? 0})</span></CardTitle></CardHeader>
        <CardContent>
          {!report.tasks?.length ? (
            <p className="text-sm text-muted-foreground italic">No tasks added</p>
          ) : (
            <div className="space-y-2">
              {report.tasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 border rounded-md px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{task.status.replace(/_/g, ' ')}</span>
                      {task.priority && <span>· {task.priority}</span>}
                      {task.projectName && <span>· {task.projectName}</span>}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">{task.hoursSpent}h</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hours breakdown */}
      {report.hoursBreakdown && (
        <Card>
          <CardHeader><CardTitle>Hours Breakdown</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const HOUR_LABELS: Record<string, string> = {
                meetingHours:  'Meetings',
                deepWorkHours: 'Deep Work',
                adminHours:    'Admin',
                reviewHours:   'Review',
                otherHours:    'Other',
              }
              const hb = report.hoursBreakdown!
              const rows = Object.entries(HOUR_LABELS).map(([key, label]) => ({
                label,
                value: (hb as Record<string, number | null>)[key] ?? 0,
              }))
              const computedTotal = rows.reduce((s, r) => s + (r.value ?? 0), 0)
              const total = hb.totalHours ?? computedTotal
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {rows.map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}h</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">{total}h</p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comments ({comments.length})</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className={`p-3 rounded-md ${c.correctionRequest ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{c.authorName}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(c.createdDate), 'MMM d, HH:mm')}</p>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          <Separator />
          {isManager && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
              <Button size="sm" onClick={handleAddComment} disabled={submitting || !comment.trim()}>
                Post Comment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
