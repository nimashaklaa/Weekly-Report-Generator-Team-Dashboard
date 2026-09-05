import { useEffect, useState } from 'react'
import { notificationsApi } from '@/api/notifications'
import { useAppDispatch } from '@/store/hooks'
import { clearUnread } from '@/store/slices/notificationSlice'
import type { Notification } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function NotificationsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notificationsApi.getAll({ size: 50 })
      .then((p) => setNotifications(p.content))
      .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    await notificationsApi.markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    dispatch(clearUnread())
  }

  const markRead = async (n: Notification) => {
    if (!n.isRead) {
      await notificationsApi.markAsRead(n.id)
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x))
    }
    if (n.relatedReportId) navigate(`/reports/${n.relatedReportId}`)
  }

  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unread > 0 && <p className="text-sm text-muted-foreground">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">You're all caught up</p>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition-colors ${n.isRead ? '' : 'border-primary/50 bg-primary/5'}`}
              onClick={() => markRead(n)}
            >
              <CardContent className="py-3 px-4 flex items-start gap-3">
                {!n.isRead && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                <div className={`flex-1 ${n.isRead ? 'pl-5' : ''}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.message && <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(n.createdDate), 'MMM d, HH:mm')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
