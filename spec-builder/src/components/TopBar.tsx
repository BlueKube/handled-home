import { Moon, Sun, ChevronRight } from 'lucide-react'
import type { ActiveView } from '@/App'
import { DOCUMENTS } from '@/constants/documents'

interface TopBarProps {
  activeView: ActiveView
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function TopBar({ activeView, darkMode, onToggleDarkMode }: TopBarProps) {
  const getBreadcrumb = () => {
    if (activeView.type === 'big-picture') return ['Big Picture']
    if (activeView.type === 'personas') return ['AI Personas']
    if (activeView.type === 'document') {
      const doc = DOCUMENTS.find((d) => d.id === activeView.docId)
      return ['Documents', doc?.name ?? activeView.docId]
    }
    return []
  }

  const crumbs = getBreadcrumb()

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-5 shrink-0">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <span className="text-muted-foreground">My App Project</span>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            <span className={i === crumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDarkMode}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[11px] font-semibold text-accent-foreground">
          JD
        </div>
      </div>
    </header>
  )
}
