import { cn } from '@/lib/utils'
import { DOCUMENTS, STATUS_CONFIG } from '@/constants/documents'
import { LayoutGrid, Sparkles, FileText, History, Settings } from 'lucide-react'
import type { ActiveView } from '@/App'

interface SidebarProps {
  activeView: ActiveView
  onNavigate: (view: ActiveView) => void
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const isActive = (type: string, docId?: string) => {
    if (type === 'big-picture') return activeView.type === 'big-picture'
    if (type === 'personas') return activeView.type === 'personas'
    if (type === 'document' && docId) {
      return activeView.type === 'document' && activeView.docId === docId
    }
    return false
  }

  return (
    <aside className="w-[280px] bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-sidebar-foreground leading-tight">
              Spec Builder
            </h1>
            <p className="text-[11px] text-sidebar-foreground/50">My App Project</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {/* Big Picture */}
        <button
          onClick={() => onNavigate({ type: 'big-picture' })}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
            isActive('big-picture')
              ? 'bg-sidebar-active text-white'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-hover'
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Big Picture
        </button>

        {/* Documents */}
        <div className="mt-5 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Documents
          </span>
        </div>

        {DOCUMENTS.map((doc) => {
          const status = STATUS_CONFIG[doc.status]
          const Icon = doc.icon
          return (
            <button
              key={doc.id}
              onClick={() => onNavigate({ type: 'document', docId: doc.id })}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors group',
                isActive('document', doc.id)
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-hover'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left truncate">{doc.shortName}</span>
              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  doc.status === 'up-to-date' && 'bg-success',
                  doc.status === 'stale' && 'bg-warning animate-pulse-soft',
                  doc.status === 'pending' && 'bg-accent',
                  doc.status === 'draft' && 'bg-muted-foreground/40',
                  doc.status === 'not-created' && 'bg-muted-foreground/20'
                )}
                title={status.label}
              />
            </button>
          )
        })}

        {/* Other sections */}
        <div className="mt-5 mb-2 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Tools
          </span>
        </div>

        <button
          onClick={() => onNavigate({ type: 'personas' })}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors',
            isActive('personas')
              ? 'bg-sidebar-active text-white'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-hover'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span className="flex-1 text-left">Personas</span>
          <span className="bg-persona-visionary/30 text-persona-visionary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            5
          </span>
        </button>

        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-hover transition-colors"
        >
          <FileText className="w-4 h-4" />
          PRDs
          <span className="ml-auto bg-accent/20 text-accent text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            1
          </span>
        </button>

        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-hover transition-colors"
        >
          <History className="w-4 h-4" />
          History
        </button>
      </nav>

      {/* Bottom settings */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-sidebar-foreground/50 hover:bg-sidebar-hover transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </aside>
  )
}
