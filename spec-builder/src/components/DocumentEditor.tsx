import { useState } from 'react'
import { cn } from '@/lib/utils'
import { DOCUMENTS, STATUS_CONFIG } from '@/constants/documents'
import { CheckCircle2, AlertTriangle, Clock, FilePlus, FileEdit, Sparkles, GitCompare } from 'lucide-react'

const statusIcons = {
  'up-to-date': CheckCircle2,
  stale: AlertTriangle,
  pending: Clock,
  draft: FileEdit,
  'not-created': FilePlus,
}

// Sample diff content for demo
const SAMPLE_DIFF = {
  masterplan: `# Spec Builder — Masterplan

## Problem Statement

Building software with AI coding agents (Claude Code, Cursor, Copilot Workspace) is fast — but only when the agent knows *what* to build. The bottleneck has shifted from implementation to specification.

## Target Users

### Primary: Small Dev Teams Using AI Coding Agents
- 1–10 person teams building products with AI-assisted development tools
- Already experiencing the "garbage in, garbage out" problem
- Know they need better specs but don't have time to maintain 6+ markdown files

### Secondary: Solo Developers / Indie Hackers
- Building multiple apps simultaneously
- Need a repeatable system to go from idea → structured docs → shipping code`,
}


interface DocumentEditorProps {
  docId: string
}

export function DocumentEditor({ docId }: DocumentEditorProps) {
  const doc = DOCUMENTS.find((d) => d.id === docId)
  const [showDiff, setShowDiff] = useState(false)

  if (!doc) return null

  const status = STATUS_CONFIG[doc.status]
  const StatusIcon = statusIcons[doc.status]

  const content = SAMPLE_DIFF.masterplan

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <doc.icon className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-[15px] font-semibold text-foreground">{doc.name}</h2>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
              status.bgColor,
              status.color
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {doc.status !== 'not-created' && (
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors',
                showDiff
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Diff View
            </button>
          )}
          {(doc.status === 'stale' || doc.status === 'not-created') && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground text-[12px] font-medium rounded-lg hover:bg-accent/90 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              {doc.status === 'not-created' ? 'Generate' : 'Re-sync'}
            </button>
          )}
        </div>
      </div>

      {/* Editor / Diff area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[800px] mx-auto p-8">
          {showDiff ? (
            <DiffView />
          ) : doc.status === 'not-created' ? (
            <EmptyDocState doc={doc} />
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="font-mono text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
                {content}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      {doc.status !== 'not-created' && (
        <div className="border-t border-border bg-card px-6 py-2 flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <span>Saved 2 minutes ago</span>
          <span>1,247 words</span>
        </div>
      )}
    </div>
  )
}

function DiffView() {
  const lines = SAMPLE_DIFF.masterplan.split('\n')

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-muted/50">
        <span className="text-[12px] font-medium text-foreground">Changes since last sync</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-success font-medium">+2 additions</span>
          <span className="text-destructive font-medium">-1 deletion</span>
        </div>
      </div>
      <div className="font-mono text-[12px] leading-[1.7]">
        {lines.slice(0, 7).map((line, i) => (
          <div key={i} className="flex">
            <span className="w-12 shrink-0 text-right pr-3 text-muted-foreground/40 select-none border-r border-border">
              {i + 1}
            </span>
            <span className="pl-4 pr-4 flex-1">{line || '\u00A0'}</span>
          </div>
        ))}

        {/* Addition */}
        <div className="flex bg-success/10 border-l-2 border-success">
          <span className="w-12 shrink-0 text-right pr-3 text-success/60 select-none border-r border-border">
            8
          </span>
          <span className="pl-4 pr-4 flex-1 text-foreground">
            + Teams that feed AI agents precise, structured documentation get production-quality code in hours.
          </span>
        </div>

        {lines.slice(7, 14).map((line, i) => (
          <div key={i + 8} className="flex">
            <span className="w-12 shrink-0 text-right pr-3 text-muted-foreground/40 select-none border-r border-border">
              {i + 9}
            </span>
            <span className="pl-4 pr-4 flex-1">{line || '\u00A0'}</span>
          </div>
        ))}

        {/* Addition */}
        <div className="flex bg-success/10 border-l-2 border-success">
          <span className="w-12 shrink-0 text-right pr-3 text-success/60 select-none border-r border-border">
            15
          </span>
          <span className="pl-4 pr-4 flex-1 text-foreground">
            + - Value speed but have been burned by shipping incomplete features
          </span>
        </div>

        {/* Deletion */}
        <div className="flex bg-destructive/10 border-l-2 border-destructive">
          <span className="w-12 shrink-0 text-right pr-3 text-destructive/60 select-none border-r border-border">
            16
          </span>
          <span className="pl-4 pr-4 flex-1 text-foreground line-through opacity-70">
            - - Know they need better specs but don't have time to maintain 6+ markdown files
          </span>
        </div>

        {/* Replacement */}
        <div className="flex bg-success/10 border-l-2 border-success">
          <span className="w-12 shrink-0 text-right pr-3 text-success/60 select-none border-r border-border">
            17
          </span>
          <span className="pl-4 pr-4 flex-1 text-foreground">
            + - Know they need better specs but lack tooling to maintain 6+ markdown files efficiently
          </span>
        </div>
      </div>
    </div>
  )
}

function EmptyDocState({ doc }: { doc: (typeof DOCUMENTS)[number] }) {
  const Icon = doc.icon
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground mb-1">
        {doc.name} not created yet
      </h3>
      <p className="text-[13px] text-muted-foreground max-w-[360px] mb-5">
        This document will be derived from{' '}
        {doc.dependsOn.length > 0
          ? doc.dependsOn.join(' and ')
          : 'your inputs'}
        . Generate it with AI or write it manually.
      </p>
      <div className="flex gap-3">
        <button className="flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-foreground text-[13px] font-medium rounded-lg hover:bg-accent/90 transition-colors">
          <Sparkles className="w-4 h-4" />
          Generate with AI
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-muted text-muted-foreground text-[13px] font-medium rounded-lg hover:bg-muted/80 transition-colors">
          Write manually
        </button>
      </div>
    </div>
  )
}
