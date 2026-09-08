import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Bell, FolderKanban,
  Users, Shield, LogOut, ChevronDown, User, Menu,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { fetchUnreadCount } from '@/store/slices/notificationSlice'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reports', icon: FileText, label: 'My Reports' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
]

const adminItems = [
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/teams', icon: Shield, label: 'Teams' },
  { to: '/admin/projects', icon: FolderKanban, label: 'Projects' },
]

function NavItems({
  isManager,
  isAdmin,
  unreadCount,
  onNavigate,
}: {
  isManager: boolean
  isAdmin: boolean
  unreadCount: number
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{label}</span>
          {label === 'Notifications' && unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 text-xs px-1.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </NavLink>
      ))}

      {isManager && (
        <>
          <div className="pt-4 pb-1 px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Management
            </p>
          </div>
          <NavLink
            to="/dashboard/team"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Team Dashboard
          </NavLink>
        </>
      )}

      {isAdmin && (
        <>
          <div className="pt-4 pb-1 px-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
          </div>
          {adminItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </>
      )}
    </nav>
  )
}

export default function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = user?.roles.includes('ADMIN') ?? false
  const isManager = (user?.roles.includes('MANAGER') || isAdmin) ?? false

  useEffect(() => {
    dispatch(fetchUnreadCount())
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 60_000)
    return () => clearInterval(interval)
  }, [dispatch])

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="h-4 w-4 mr-2" /> Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex h-screen bg-background">

      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="hidden lg:flex w-64 border-r flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b shrink-0">
          <span className="font-semibold text-lg">WeeklyReport</span>
        </div>
        <NavItems
          isManager={isManager}
          isAdmin={isAdmin}
          unreadCount={unreadCount}
        />
        <div className="border-t p-3 shrink-0">
          {userMenu}
        </div>
      </aside>

      {/* ── Right side: mobile top bar + page content ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile top bar (hidden on lg+) */}
        <header className="lg:hidden flex items-center gap-2 h-14 px-4 border-b bg-background shrink-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" aria-label="Open menu" />
            }>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" showCloseButton={false} className="p-0 w-72 flex flex-col">
              <div className="h-14 flex items-center px-6 border-b shrink-0">
                <span className="font-semibold text-lg">WeeklyReport</span>
              </div>
              <NavItems
                isManager={isManager}
                isAdmin={isAdmin}
                unreadCount={unreadCount}
                onNavigate={() => setMobileOpen(false)}
              />
              <div className="border-t p-3 shrink-0">
                {userMenu}
              </div>
            </SheetContent>
          </Sheet>

          <span className="font-semibold flex-1 text-base">WeeklyReport</span>

          {/* Notification bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </Button>

          {/* Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
