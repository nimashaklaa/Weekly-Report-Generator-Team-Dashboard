import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle, MessageSquare, User, History, ChevronDown, ChevronRight, Star, TriangleAlert } from 'lucide-react'
import { format } from 'date-fns'
import { reportsApi } from '@/api/reports'
import type { WeeklyReport, ReportComment, ReportVersion } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/shared/StatusBadge'
import { toast } from '@/components/ui/toast'

const MOOD_LABELS: Record<string, string> = {
  GREAT: '😄 Great', GOOD: '🙂 Good', NEUTRAL: '😐 Neutral',
  DIFFICULT: '😟 Difficult', BURNED_OUT: '😩 Burned out',
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      {value?.trim()
        ? <p className="text-sm whitespace-pre-wrap">{value.trim()}</p>
        : <p className="text-sm text-muted-foreground italic">Not filled in</p>}
    </div>
  )
}

export default function ManagerReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const reportId = Number(id)

  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [comments, setComments] = useState<ReportComment[]>([])
  const [versions, setVersions] = useState<ReportVersion[]>([])
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [comment, setComment] = useState('')
  const [correctionNote, setCorrectionNote] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)

  useEffect(() => {
    Promise.all([
      reportsApi.getById(reportId),
      reportsApi.getComments(reportId),
      reportsApi.getVersions(reportId),
    ]).then(([r, c, v]) => {
      setReport(r)
      setComments(c)
      setVersions(v)
      // If not submitted, redirect to regular detail page
      if (r.status !== 'SUBMITTED') {
        navigate(`/reports/${reportId}`, { replace: true })
      }
    }).finally(() => setLoading(false))
  }, [reportId, navigate])

  const handleApprove = async () => {
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
    if (!correctionNote.trim()) {
      toast.add({ title: 'Comment required', description: 'Describe what needs to be corrected.', type: 'warning' })
      return
    }
    setSubmitting(true)
    try {
      const updated = await reportsApi.requestCorrection(reportId, correctionNote)
      setReport(updated)
      setShowCorrection(false)
      setCorrectionNote('')
      const updatedComments = await reportsApi.getComments(reportId)
      setComments(updatedComments)
      toast.add({ title: 'Correction requested', type: 'success' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.add({ title: 'Failed to request correction', description: msg ?? 'Please try again.', type: 'error' })
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
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!report) return <div className="p-6 text-center text-muted-foreground">Report not found</div>

  const isApproved = report.status === 'APPROVED'
  const isCorrectionSent = report.status === 'NEEDS_CORRECTION'
  const reviewed = isApproved || isCorrectionSent

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Review Report</h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Week {report.weekNumber}, {report.weekYear} · {report.authorName}
            {report.submittedAt && ` · Submitted ${format(new Date(report.submittedAt), 'MMM d, yyyy')}`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground"
          onClick={() => navigate(`/members/${report.authorId}`)}
        >
          <User className="h-4 w-4 mr-1.5" />
          Profile
        </Button>
      </div>

      {/* Review actions */}
      {!reviewed ? (
        <Card className="border-2">
          <CardContent className="pt-5">
            {!showCorrection ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 sm:flex-none"
                  onClick={handleApprove}
                  disabled={submitting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Report
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  onClick={() => setShowCorrection(true)}
                  disabled={submitting}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">What needs to be corrected?</p>
                <Textarea
                  placeholder="Describe specifically what the member should fix or improve…"
                  rows={4}
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleRequestCorrection}
                    disabled={submitting || !correctionNote.trim()}
                  >
                    Send Correction Request
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCorrection(false); setCorrectionNote('') }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${isApproved ? 'bg-muted/40' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'}`}>
          {isApproved
            ? <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            : <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />}
          <p className="text-sm">
            {isApproved
              ? `Approved${report.reviewerName ? ` by ${report.reviewerName}` : ''}${report.reviewedAt ? ` on ${format(new Date(report.reviewedAt), 'MMM d, yyyy')}` : ''}`
              : `Correction requested${report.reviewerName ? ` by ${report.reviewerName}` : ''}${report.reviewedAt ? ` on ${format(new Date(report.reviewedAt), 'MMM d, yyyy')}` : ''}`}
          </p>
        </div>
      )}

      {/* Week Overview */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Week Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Summary" value={report.weekSummary} />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Mood</p>
            {report.overallMood
              ? <p className="text-sm">{MOOD_LABELS[report.overallMood] ?? report.overallMood}</p>
              : <p className="text-sm text-muted-foreground italic">Not filled in</p>}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Achievements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {report.keyAchievement?.trim() && (
            <div className="flex gap-3 p-3 rounded-lg border bg-muted/40">
              <Star className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Key Achievement</p>
                <p className="text-sm font-medium">{report.keyAchievement.trim()}</p>
              </div>
            </div>
          )}
          <Field label="Achievements / Highlights" value={report.achievements} />
        </CardContent>
      </Card>

      {/* Blockers & Plans */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Blockers & Plans</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {report.keyIssue?.trim() && (
            <div className="flex gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
              <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Key Issue</p>
                <p className="text-sm font-medium">{report.keyIssue.trim()}</p>
              </div>
            </div>
          )}
          <Field label="Blockers" value={report.blockers} />
          <Field label="Next Week Plan" value={report.nextWeekPlan} />
          {report.generalNotes?.trim() && <Field label="General Notes" value={report.generalNotes} />}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tasks <span className="text-muted-foreground font-normal">({report.tasks?.length ?? 0})</span></CardTitle>
        </CardHeader>
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
          <CardHeader><CardTitle className="text-sm">Hours Breakdown</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const HOUR_LABELS: Record<string, string> = {
                meetingHours: 'Meetings', deepWorkHours: 'Deep Work',
                adminHours: 'Admin', reviewHours: 'Review', otherHours: 'Other',
              }
              const hb = report.hoursBreakdown!
              const rows = Object.entries(HOUR_LABELS).map(([key, label]) => ({
                label, value: (hb as unknown as Record<string, number | null>)[key] ?? 0,
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

      {/* Version History */}
      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4" />
              Past Versions
              <span className="text-muted-foreground font-normal">({versions.length})</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Snapshots saved each time the member resubmitted after a correction request.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {versions.map((v) => {
              const isOpen = expandedVersion === v.id
              let snapshot: WeeklyReport | null = null
              try { snapshot = v.snapshotJson ? JSON.parse(v.snapshotJson) as WeeklyReport : null } catch { snapshot = null }
              return (
                <div key={v.id} className="border rounded-lg overflow-hidden">
                  {/* Version row header */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                    onClick={() => setExpandedVersion(isOpen ? null : v.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-6">v{v.versionNumber}</span>
                      <span className="text-sm font-medium">Version {v.versionNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        · saved {format(new Date(v.createdDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {isOpen
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Snapshot content */}
                  {isOpen && snapshot && (
                    <div className="border-t bg-muted/20 px-4 py-4 space-y-5">
                      {/* Summary + Mood */}
                      <div className="space-y-3">
                        <Field label="Summary" value={snapshot.weekSummary} />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Mood</p>
                          {snapshot.overallMood
                            ? <p className="text-sm">{MOOD_LABELS[snapshot.overallMood] ?? snapshot.overallMood}</p>
                            : <p className="text-sm text-muted-foreground italic">Not filled in</p>}
                        </div>
                      </div>

                      <Separator />

                      {/* Achievements */}
                      <div className="space-y-3">
                        {snapshot.keyAchievement?.trim() && (
                          <div className="flex gap-3 p-3 rounded-lg border bg-muted/40">
                            <Star className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Key Achievement</p>
                              <p className="text-sm font-medium">{snapshot.keyAchievement.trim()}</p>
                            </div>
                          </div>
                        )}
                        <Field label="Achievements / Highlights" value={snapshot.achievements} />
                      </div>

                      <Separator />

                      {/* Blockers & Plans */}
                      <div className="space-y-3">
                        {snapshot.keyIssue?.trim() && (
                          <div className="flex gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                            <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Key Issue</p>
                              <p className="text-sm font-medium">{snapshot.keyIssue.trim()}</p>
                            </div>
                          </div>
                        )}
                        <Field label="Blockers" value={snapshot.blockers} />
                        <Field label="Next Week Plan" value={snapshot.nextWeekPlan} />
                      </div>

                      {/* Tasks */}
                      {snapshot.tasks && snapshot.tasks.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              Tasks ({snapshot.tasks.length})
                            </p>
                            <div className="space-y-1.5">
                              {snapshot.tasks.map((t, i) => (
                                <div key={i} className="flex items-start justify-between gap-3 border rounded-md px-3 py-2 bg-background">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{t.title}</p>
                                    <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                                      <span>{t.status?.replace(/_/g, ' ')}</span>
                                      {t.priority && <span>· {t.priority}</span>}
                                    </div>
                                  </div>
                                  <span className="text-sm text-muted-foreground shrink-0">{t.hoursSpent}h</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Snapshot parse error fallback */}
                  {isOpen && !snapshot && (
                    <div className="border-t px-4 py-3 bg-muted/20">
                      <p className="text-sm text-muted-foreground italic">Snapshot data unavailable.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Comments thread */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              className={`p-3 rounded-md ${c.correctionRequest ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">{c.authorName}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(c.createdDate), 'MMM d, HH:mm')}</p>
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          <Separator />
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
        </CardContent>
      </Card>
    </div>
  )
}
