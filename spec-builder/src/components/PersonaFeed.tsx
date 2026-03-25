import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PERSONAS, MOCK_SUGGESTIONS } from '@/constants/personas'
import { Check, X, Pencil, FileText, Bookmark } from 'lucide-react'

export function PersonaFeed() {
  const [enabledPersonas, setEnabledPersonas] = useState<Set<string>>(
    new Set(PERSONAS.map((p) => p.id))
  )
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const togglePersona = (id: string) => {
    setEnabledPersonas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredSuggestions = MOCK_SUGGESTIONS.filter((s) => {
    if (dismissed.has(s.id)) return false
    if (!enabledPersonas.has(s.personaId)) return false
    if (activeFilter !== 'all' && s.personaId !== activeFilter) return false
    return true
  })

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">AI Advisors</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Your team of AI personas offering different perspectives on your project
          </p>
        </div>
      </div>

      {/* Persona toggles */}
      <div className="flex items-center gap-3 mb-6">
        {PERSONAS.map((persona) => {
          const Icon = persona.icon
          const isEnabled = enabledPersonas.has(persona.id)
          return (
            <button
              key={persona.id}
              onClick={() => togglePersona(persona.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all',
                isEnabled
                  ? cn(persona.bgClass, persona.borderClass, persona.colorClass)
                  : 'bg-muted/50 border-border text-muted-foreground opacity-50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {persona.name}
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isEnabled ? 'bg-current' : 'bg-muted-foreground/30'
                )}
              />
            </button>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-border">
        {[
          { id: 'all', label: 'All' },
          ...PERSONAS.map((p) => ({ id: p.id, label: p.name.replace('The ', '') })),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              'px-3 py-2 text-[12px] font-medium border-b-2 transition-colors -mb-[1px]',
              activeFilter === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Suggestion cards */}
      <div className="space-y-4">
        {filteredSuggestions.map((suggestion) => {
          const persona = PERSONAS.find((p) => p.id === suggestion.personaId)!
          const Icon = persona.icon
          return (
            <div
              key={suggestion.id}
              className={cn(
                'bg-card rounded-xl border p-5 border-l-[3px] animate-slide-in',
                persona.borderClass
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    persona.bgClass
                  )}
                >
                  <Icon className={cn('w-4 h-4', persona.colorClass)} />
                </div>
                <div>
                  <span className={cn('text-[12px] font-semibold', persona.colorClass)}>
                    {persona.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-2">
                    {suggestion.timestamp}
                  </span>
                </div>
                <span
                  className={cn(
                    'ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full',
                    suggestion.type === 'feature' && 'bg-persona-visionary/10 text-persona-visionary',
                    suggestion.type === 'warning' && 'bg-persona-engineer/10 text-persona-engineer',
                    suggestion.type === 'prioritization' && 'bg-persona-pm/10 text-persona-pm',
                    suggestion.type === 'gap' && 'bg-persona-auditor/10 text-persona-auditor'
                  )}
                >
                  {suggestion.type}
                </span>
              </div>

              {/* Content */}
              <h4 className="text-[14px] font-semibold text-foreground mb-1.5">
                {suggestion.title}
              </h4>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                {suggestion.body}
              </p>

              {/* Related doc */}
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 mb-4">
                Related to: <span className="text-accent font-medium">{suggestion.relatedDoc}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-success bg-success/10 rounded-lg hover:bg-success/20 transition-colors">
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </button>
                <button
                  onClick={() => setDismissed((prev) => new Set([...prev, suggestion.id]))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                {suggestion.type === 'gap' && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-accent bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    Create PRD
                  </button>
                )}
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors ml-auto">
                  <Bookmark className="w-3.5 h-3.5" />
                  Save for later
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <SparklesIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-[14px] font-semibold text-foreground mb-1">No suggestions</h3>
          <p className="text-[12px] text-muted-foreground">
            Enable personas and edit documents to see AI suggestions appear here.
          </p>
        </div>
      )}
    </div>
  )
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272z" />
    </svg>
  )
}
