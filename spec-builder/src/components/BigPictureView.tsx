import { cn } from '@/lib/utils'
import { DOCUMENTS, STATUS_CONFIG } from '@/constants/documents'
import { MOCK_SUGGESTIONS, PERSONAS } from '@/constants/personas'
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  FilePlus,
  FileEdit,
  ArrowDown,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import type { ActiveView } from '@/App'

interface BigPictureViewProps {
  onNavigate: (view: ActiveView) => void
}

const statusIcons = {
  'up-to-date': CheckCircle2,
  stale: AlertTriangle,
  pending: Clock,
  draft: FileEdit,
  'not-created': FilePlus,
}

export function BigPictureView({ onNavigate }: BigPictureViewProps) {
  const staleCount = DOCUMENTS.filter((d) => d.status === 'stale').length
  const pendingCount = DOCUMENTS.filter((d) => d.status === 'pending').length
  const upToDateCount = DOCUMENTS.filter((d) => d.status === 'up-to-date').length

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">Big Picture</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Your document chain at a glance — {upToDateCount} synced, {staleCount} stale, {pendingCount} pending
          </p>
        </div>
        {staleCount > 0 && (
          <button className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground text-[13px] font-medium rounded-lg hover:bg-accent/90 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Sync {staleCount} documents
          </button>
        )}
      </div>

      <div className="flex gap-8">
        {/* Document Chain */}
        <div className="flex-1">
          {/* Masterplan (root) */}
          <DocumentNode
            doc={DOCUMENTS[0]}
            onClick={() => onNavigate({ type: 'document', docId: DOCUMENTS[0].id })}
          />

          {/* Arrow */}
          <div className="flex justify-center py-2">
            <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
          </div>

          {/* Second tier: CLAUDE.md, Design, App Flow, Operating Model */}
          <div className="grid grid-cols-2 gap-3">
            {[DOCUMENTS[1], DOCUMENTS[2], DOCUMENTS[3], DOCUMENTS[6]].map((doc) => (
              <DocumentNode
                key={doc.id}
                doc={doc}
                onClick={() => onNavigate({ type: 'document', docId: doc.id })}
              />
            ))}
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-2">
            <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
          </div>

          {/* Third tier: Screen Flows */}
          <DocumentNode
            doc={DOCUMENTS[4]}
            onClick={() => onNavigate({ type: 'document', docId: DOCUMENTS[4].id })}
          />

          {/* Arrow */}
          <div className="flex justify-center py-2">
            <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
          </div>

          {/* Fourth tier: Feature List */}
          <DocumentNode
            doc={DOCUMENTS[5]}
            onClick={() => onNavigate({ type: 'document', docId: DOCUMENTS[5].id })}
          />
        </div>

        {/* Right Panel: Recent Suggestions */}
        <div className="w-[340px] shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-persona-visionary" />
            <h3 className="text-[14px] font-semibold text-foreground">Recent Suggestions</h3>
            <span className="text-[11px] bg-persona-visionary/10 text-persona-visionary font-semibold px-1.5 py-0.5 rounded-full">
              {MOCK_SUGGESTIONS.length}
            </span>
          </div>

          <div className="space-y-3">
            {MOCK_SUGGESTIONS.slice(0, 3).map((suggestion) => {
              const persona = PERSONAS.find((p) => p.id === suggestion.personaId)!
              const Icon = persona.icon
              return (
                <div
                  key={suggestion.id}
                  className={cn(
                    'bg-card rounded-xl border p-4 border-l-[3px] cursor-pointer hover:shadow-md transition-shadow',
                    persona.borderClass
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center',
                        persona.bgClass
                      )}
                    >
                      <Icon className={cn('w-3 h-3', persona.colorClass)} />
                    </div>
                    <span className={cn('text-[11px] font-semibold', persona.colorClass)}>
                      {persona.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {suggestion.timestamp}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-foreground mb-1">
                    {suggestion.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground line-clamp-2">
                    {suggestion.body}
                  </p>
                </div>
              )
            })}
          </div>

          <button className="w-full mt-3 py-2 text-[12px] text-accent font-medium hover:underline">
            View all suggestions
          </button>
        </div>
      </div>
    </div>
  )
}

function DocumentNode({
  doc,
  onClick,
}: {
  doc: (typeof DOCUMENTS)[number]
  onClick: () => void
}) {
  const status = STATUS_CONFIG[doc.status]
  const StatusIcon = statusIcons[doc.status]
  const DocIcon = doc.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full bg-card rounded-xl border p-4 text-left cursor-pointer transition-all hover:shadow-md group',
        doc.status === 'stale' && 'border-warning/30',
        doc.status === 'pending' && 'border-accent/30 border-dashed',
        doc.status === 'not-created' && 'border-dashed opacity-60 hover:opacity-100'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
            doc.status === 'up-to-date' && 'bg-success/10',
            doc.status === 'stale' && 'bg-warning/10',
            doc.status === 'pending' && 'bg-accent/10',
            doc.status === 'not-created' && 'bg-muted'
          )}
        >
          <DocIcon
            className={cn(
              'w-4.5 h-4.5',
              doc.status === 'up-to-date' && 'text-success',
              doc.status === 'stale' && 'text-warning',
              doc.status === 'pending' && 'text-accent',
              doc.status === 'not-created' && 'text-muted-foreground'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground truncate">
              {doc.name}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0',
                status.bgColor,
                status.color
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {doc.description}
          </p>
          {doc.lastEdited && (
            <p className="text-[10px] text-muted-foreground/60 mt-1.5">
              Edited {doc.lastEdited}
              {doc.changeCount && (
                <span className="ml-2 text-accent font-medium">
                  +{doc.changeCount} changes
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
