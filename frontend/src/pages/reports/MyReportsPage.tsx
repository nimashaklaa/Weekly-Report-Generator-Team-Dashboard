import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { reportsApi } from '@/api/reports'
import type { WeeklyReportSummary } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from '@/components/shared/StatusBadge'

export default function MyReportsPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<WeeklyReportSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsApi.getMyReports().then(setReports).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Reports</h1>
          <p className="text-muted-foreground text-sm">Your weekly reports history</p>
        </div>
        <Button onClick={() => navigate('/reports/new')}>
          <Plus className="h-4 w-4 mr-2" /> New Report
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No reports yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Start by creating your first weekly report.</p>
            <Button onClick={() => navigate('/reports/new')}>
              <Plus className="h-4 w-4 mr-2" /> Create Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/reports/${report.id}`)}
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Week {report.weekNumber}, {report.weekYear}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {report.submittedAt
                        ? `Submitted ${format(new Date(report.submittedAt), 'MMM d')}`
                        : report.createdDate
                          ? `Created ${format(new Date(report.createdDate), 'MMM d')}`
                          : ''}
                    </p>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
