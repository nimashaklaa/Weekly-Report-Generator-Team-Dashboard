import { Link } from 'react-router-dom'
import { BarChart3, Users, FileText, CheckCircle2, TrendingUp, Bell } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

const FEATURES = [
  { icon: FileText,     title: 'Weekly Reports',      desc: 'Submit structured weekly reports with tasks, hours, mood, and highlights.' },
  { icon: BarChart3,    title: 'Team Dashboard',       desc: 'Live submission rates, status breakdowns, and who hasn\'t reported yet.' },
  { icon: TrendingUp,   title: 'Insights & Trends',   desc: 'Historical charts for hours, mood, workload by project, and team activity.' },
  { icon: CheckCircle2, title: 'Manager Review',       desc: 'Approve reports or request corrections with threaded comments.' },
  { icon: Users,        title: 'Member Profiles',      desc: 'Per-member stats, approval rates, mood history, and report timeline.' },
  { icon: Bell,         title: 'Notifications',        desc: 'Real-time alerts when reports are submitted, approved, or sent back.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Nav */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <span className="font-semibold text-sm">WeeklyPulse</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Sign in</Link>
          <Link to="/register" className={buttonVariants({ size: 'sm' })}>Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Team reporting, simplified
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
          Keep your team<br />aligned, every week
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          WeeklyPulse lets engineers submit structured weekly reports and gives managers
          real-time visibility into team health, output, and blockers all in one place.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link to="/register" className={buttonVariants({ size: 'lg' })}>Get started</Link>
          <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Sign in</Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-center mb-10">Everything your team needs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-background p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="font-semibold text-sm">WeeklyPulse</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Weekly reporting and team visibility for engineering teams.
            </p>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Get started</Link></li>
            </ul>
          </div>

          {/* Roles */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">For teams</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Engineers</li>
              <li>Engineering Managers</li>
              <li>Team Leads</li>
            </ul>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} WeeklyPulse. Built for engineering teams.</span>
          <span>Made with Spring Boot + React</span>
        </div>
      </footer>

    </div>
  )
}
