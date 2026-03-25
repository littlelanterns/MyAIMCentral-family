// Shared props interface for all tracker type components
import type { DashboardWidget, WidgetDataPoint } from '@/types/widgets'

export interface TrackerProps {
  widget: DashboardWidget
  dataPoints: WidgetDataPoint[]
  onRecordData?: (value: number, metadata?: Record<string, unknown>) => void
  variant?: string
  isCompact?: boolean
}
