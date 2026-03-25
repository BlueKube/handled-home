import type { LucideIcon } from 'lucide-react'
import { Sparkles, Wrench, ListChecks, SearchCheck } from 'lucide-react'

export interface PersonaDef {
  id: string
  name: string
  icon: LucideIcon
  colorClass: string
  bgClass: string
  borderClass: string
  description: string
  personality: string
}

export const PERSONAS: PersonaDef[] = [
  {
    id: 'visionary',
    name: 'The Visionary',
    icon: Sparkles,
    colorClass: 'text-persona-visionary',
    bgClass: 'bg-persona-visionary/10',
    borderClass: 'border-persona-visionary',
    description: 'Feature ideas and growth opportunities',
    personality: 'An excited co-founder who sees possibilities everywhere',
  },
  {
    id: 'engineer',
    name: 'The Engineer',
    icon: Wrench,
    colorClass: 'text-persona-engineer',
    bgClass: 'bg-persona-engineer/10',
    borderClass: 'border-persona-engineer',
    description: 'Technical feasibility and complexity warnings',
    personality: 'A pragmatic senior engineer who\'s seen projects go sideways',
  },
  {
    id: 'pm',
    name: 'The PM',
    icon: ListChecks,
    colorClass: 'text-persona-pm',
    bgClass: 'bg-persona-pm/10',
    borderClass: 'border-persona-pm',
    description: 'Prioritization and sequencing advice',
    personality: 'An organized, timeline-conscious PM who keeps things shipping',
  },
  {
    id: 'auditor',
    name: 'The Auditor',
    icon: SearchCheck,
    colorClass: 'text-persona-auditor',
    bgClass: 'bg-persona-auditor/10',
    borderClass: 'border-persona-auditor',
    description: 'Doc-vs-code gap detection and consistency',
    personality: 'A detail-oriented QA lead who looks backward at what exists',
  },
]

export interface Suggestion {
  id: string
  personaId: string
  title: string
  body: string
  relatedDoc: string
  timestamp: string
  type: 'feature' | 'warning' | 'prioritization' | 'gap'
}

export const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: '1',
    personaId: 'visionary',
    title: 'Template Marketplace',
    body: 'What if users could share their document chain templates? A SaaS marketplace with common app types (SaaS, marketplace, mobile app) would dramatically lower the onboarding barrier and create a community flywheel.',
    relatedDoc: 'masterplan',
    timestamp: '12 min ago',
    type: 'feature',
  },
  {
    id: '2',
    personaId: 'engineer',
    title: 'CRDT Complexity Warning',
    body: 'Real-time collaboration on documents will require a CRDT library (Yjs or Automerge). This is a significant architectural decision — it affects the editor layer, database schema, and sync protocol. Recommend deferring to Phase 5 and using simple last-write-wins until then.',
    relatedDoc: 'screen-flows',
    timestamp: '34 min ago',
    type: 'warning',
  },
  {
    id: '3',
    personaId: 'pm',
    title: 'Ship Auth + Editor Before Personas',
    body: 'The persona system is the exciting part, but users can\'t experience it without a working editor. Recommend: Phase 1 (auth + CRUD), Phase 2 (editor + diff), Phase 3 (personas). This gets value in users\' hands fastest.',
    relatedDoc: 'feature-list',
    timestamp: '1 hour ago',
    type: 'prioritization',
  },
  {
    id: '4',
    personaId: 'auditor',
    title: 'Missing Navigation Path',
    body: 'The screen-flows doc describes a "Project History" page, but the app-flow doc doesn\'t include a route for it in the sidebar navigation. Users would have no way to access version history. We should add /project/:id/history to the route tree.',
    relatedDoc: 'app-flow',
    timestamp: '2 hours ago',
    type: 'gap',
  },
  {
    id: '5',
    personaId: 'visionary',
    title: 'AI-Powered Scope Estimator',
    body: 'When a PRD is generated, what if the PM persona could automatically estimate implementation time based on the document chain complexity? "This PRD touches 4 documents and adds 3 new screens — estimated 2-3 batches." That would be incredibly useful for planning.',
    relatedDoc: 'operating-model',
    timestamp: '3 hours ago',
    type: 'feature',
  },
]
