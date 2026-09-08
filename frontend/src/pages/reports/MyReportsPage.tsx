import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { reportsApi } from '@/api/reports'
import type { WeeklyReportSummary, ReportStatus } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/toast'

const STATUS_COLOR: Record<ReportStatus, string> = {
  DRAFT: 'bg-slate-300',
  SUBMITTED: 'bg-blue-500',
  NEEDS_CORRECTION: 'bg-red-500',
  APPROVED: 'bg-emerald-500',
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  NEEDS_CORRECTION: 'Needs Correction',
  APPROVED: 'Approved',
}

const STATUS_TEXT: Record<ReportStatus, string> = {
  DRAFT: 'text-slate-500',
  SUBMITTED: 'text-blue-600',
  NEEDS_CORRECTION: 'text-red-600',
  APPROVED: 'text-emerald-600',
}

const MOOD_EMOJI: Record<string, string> = {
  GREAT: '😄',
  GOOD: '🙂',
  NEUTRAL: '😐',
  DIFFICULT: '😟',
  BURNED_OUT: '😩',
}

function DocumentPreview({ report }: { report: WeeklyReportSummary }) {
  return (
    <div className="relative w-full bg-white rounded-t-sm overflow-hidden" style={{ aspectRatio: '3/4' }}>
      {/* Status colour strip */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${STATUS_COLOR[report.status]}`} />

      <div className="px-5 pt-7 pb-4 h-full flex flex-col">
        {/* Week header */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
            Week {report.weekNumber}
          </p>
          <p className="text-2xl font-bold text-slate-800 leading-tight">{report.weekYear}</p>
          {report.overallMood && (
            <p className="text-base mt-1">{MOOD_EMOJI[report.overallMood]}</p>
          )}
        </div>

        {/* Simulated content lines */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-[85%]" />
          <div className="h-2 bg-slate-100 rounded-full w-[90%]" />
          <div className="h-2 bg-slate-100 rounded-full w-[60%]" />
          <div className="mt-4 h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-[75%]" />
          <div className="h-2 bg-slate-100 rounded-full w-[80%]" />
          <div className="mt-4 h-2 bg-slate-100 rounded-full w-full" />
          <div className="h-2 bg-slate-100 rounded-full w-[55%]" />
        </div>

        {/* Status pill at bottom */}
        <div className="mt-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_TEXT[report.status]}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_COLOR[report.status]}`} />
            {STATUS_LABEL[report.status]}
          </span>
        </div>
      </div>
    </div>
  )
}

function NewDocumentCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-lg overflow-hidden border border-border hover:border-primary/50 hover:shadow-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Page */}
      <div
        className="w-full bg-white flex items-center justify-center border-b border-border group-hover:bg-slate-50 transition-colors"
        style={{ aspectRatio: '3/4' }}
      >
        <Plus className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
      </div>
      {/* Label */}
      <div className="px-3 py-2.5 bg-background">
        <p className="text-sm font-medium text-foreground truncate">Blank report</p>
        <p className="text-xs text-muted-foreground mt-0.5">Start a new weekly report</p>
      </div>
    </button>
  )
}

function ReportCard({
  report,
  onClick,
  onDelete,
  deleting,
}: {
  report: WeeklyReportSummary
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
  deleting: boolean
}) {
  const date = report.submittedAt ?? report.createdDate
  const dateLabel = report.submittedAt
    ? `Submitted ${format(new Date(report.submittedAt), 'MMM d')}`
    : report.createdDate
      ? `Created ${format(new Date(report.createdDate), 'MMM d')}`
      : ''

  return (
    <div className="group relative flex flex-col rounded-lg overflow-hidden border border-border hover:border-primary/40 hover:shadow-md transition-all duration-150 cursor-pointer">
      {/* Delete button — visible on hover for DRAFT */}
      {report.status === 'DRAFT' && (
        <button
          onClick={onDelete}
          disabled={deleting}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Delete draft"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Page preview */}
      <div onClick={onClick} className="border-b border-border shadow-sm">
        <DocumentPreview report={report} />
      </div>

      {/* Footer */}
      <div onClick={onClick} className="px-3 py-2.5 bg-background">
        <p className="text-sm font-medium text-foreground truncate">
          Week {report.weekNumber}, {report.weekYear}
        </p>
        {report.teamName && (
          <p className="text-xs text-muted-foreground truncate">{report.teamName}</p>
        )}
        {dateLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
        )}
      </div>
    </div>
  )
}

export default function MyReportsPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<WeeklyReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  useEffect(() => {
    reportsApi.getMyReports().then(setReports).finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (confirmId === null) return
    const idToDelete = confirmId
    setDeletingId(idToDelete)
    setConfirmId(null)
    try {
      await reportsApi.deleteDraft(idToDelete)
      setReports((prev) => prev.filter((r) => r.id !== idToDelete))
      toast.add({ title: 'Report deleted', type: 'success' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.add({ title: 'Failed to delete', description: msg ?? 'Please try again.', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Reports</h1>
          <p className="text-muted-foreground text-sm">Your weekly reports history</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-lg overflow-hidden border border-border">
              <Skeleton className="w-full rounded-none" style={{ aspectRatio: '3/4' }} />
              <div className="px-3 py-2.5 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {/* New blank document card */}
          <NewDocumentCard onClick={() => navigate('/reports/new')} />

          {/* Report cards */}
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={() => navigate(`/reports/${report.id}`)}
              onDelete={(e) => { e.stopPropagation(); setConfirmId(report.id) }}
              deleting={deletingId === report.id}
            />
          ))}
        </div>
      )}

      {!loading && reports.length === 0 && (
        <p className="text-center text-sm text-muted-foreground mt-12">
          No reports yet — click the blank report card to get started.
        </p>
      )}

      <AlertDialog open={confirmId !== null} onOpenChange={(open) => { if (!open) setConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The draft will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
