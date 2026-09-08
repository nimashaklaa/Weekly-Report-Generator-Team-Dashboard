// Shared chart color palette — consistent across all dashboards
// Using uniform 600-weight hues so saturation and lightness stay cohesive

export const STATUS_CHART_COLORS: Record<string, string> = {
  DRAFT:            '#64748b', // slate-500   — neutral / not yet started
  SUBMITTED:        '#2563eb', // blue-600    — in review
  NEEDS_CORRECTION: '#d97706', // amber-600   — action required
  APPROVED:         '#16a34a', // green-600   — done
}

export const MOOD_CHART_COLORS: Record<string, string> = {
  GREAT:      '#16a34a', // green-600
  GOOD:       '#2563eb', // blue-600
  NEUTRAL:    '#64748b', // slate-500
  DIFFICULT:  '#d97706', // amber-600
  BURNED_OUT: '#dc2626', // red-600
}
