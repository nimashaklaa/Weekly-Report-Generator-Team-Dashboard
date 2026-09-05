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
  const isManager = user?.roles.includes('MANAGER') || user?.roles.includes('ADMIN')
  const isAuthor = report?.author.id === user?.id
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
    setSubmitting(true)
    try {
      const updated = await reportsApi.submit(reportId)
      setReport(updated)
    } finally { setSubmitting(false) }
  }

  const handleApprove = async () => {
    if (!report) return
    setSubmitting(true)
    try {
      const updated = await reportsApi.approve(reportId)
      setReport(updated)
    } finally { setSubmitting(false) }
  }

  const handleRequestCorrection = async () => {
    if (!correctionComment.trim()) return
    setSubmitting(true)
    try {
      const updated = await reportsApi.requestCorrection(reportId, correctionComment)
      setReport(updated)
      setShowCorrection(false)
      setCorrectionComment('')
      const updatedComments = await reportsApi.getComments(reportId)
      setComments(updatedComments)
    } finally { setSubmitting(false) }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const newComment = await reportsApi.addComment(reportId, comment)
      setComments((prev) => [...prev, newComment])
      setComment('')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!report) return <div className="p-6 text-center text-muted-foreground">Report not found</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
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
            {report.author.firstName} {report.author.lastName}
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
        <CardHeader><CardTitle>Week Summary</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {report.weekSummary && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
              <p className="text-sm whitespace-pre-wrap">{report.weekSummary}</p>
            </div>
          )}
          {report.overallMood && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Mood</p>
              <p className="text-sm">{report.overallMood}</p>
            </div>
          )}
          {report.blockers && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Blockers</p>
              <p className="text-sm whitespace-pre-wrap">{report.blockers}</p>
            </div>
          )}
          {report.nextWeekPlan && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Next week plan</p>
              <p className="text-sm whitespace-pre-wrap">{report.nextWeekPlan}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader><CardTitle>Tasks ({report.tasks?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {report.tasks?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks added</p>
          ) : (
            <div className="space-y-3">
              {report.tasks?.map((task) => (
                <div key={task.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    <span className="text-xs text-muted-foreground">{task.hoursSpent}h</span>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{task.status}</span>
                    {task.priority && <span>· {task.priority}</span>}
                  </div>
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
            <div className="grid grid-cols-3 gap-4 text-sm">
              {Object.entries(report.hoursBreakdown)
                .filter(([key]) => key !== 'totalHours')
                .map(([key, val]) => (
                  <div key={key}>
                    <p className="text-muted-foreground capitalize">{key.replace('Hours', '').replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="font-medium">{val}h</p>
                  </div>
                ))}
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold">{report.hoursBreakdown.totalHours}h</p>
              </div>
            </div>
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
            <div key={c.id} className={`p-3 rounded-md ${c.isCorrectionRequest ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{c.author.firstName} {c.author.lastName}</p>
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
