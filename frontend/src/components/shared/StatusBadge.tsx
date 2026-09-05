import { Badge } from '@/components/ui/badge'
import type { ReportStatus } from '@/types'

const config: Record<ReportStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SUBMITTED: { label: 'Submitted', variant: 'default' },
  NEEDS_CORRECTION: { label: 'Needs Correction', variant: 'destructive' },
  APPROVED: { label: 'Approved', variant: 'outline' },
}

export default function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
