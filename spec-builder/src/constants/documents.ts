import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  FileCode,
  Palette,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Calculator,
} from 'lucide-react'

export type DocStatus = 'up-to-date' | 'stale' | 'pending' | 'draft' | 'not-created'

export interface DocumentDef {
  id: string
  name: string
  shortName: string
  icon: LucideIcon
  status: DocStatus
  description: string
  dependsOn: string[]
  lastEdited?: string
  changeCount?: number
}

export const DOCUMENTS: DocumentDef[] = [
  {
    id: 'masterplan',
    name: 'Masterplan',
    shortName: 'Masterplan',
    icon: BookOpen,
    status: 'up-to-date',
    description: 'Business plan, vision, value proposition, growth strategy',
    dependsOn: [],
    lastEdited: '2 hours ago',
  },
  {
    id: 'claude-md',
    name: 'CLAUDE.md',
    shortName: 'CLAUDE.md',
    icon: FileCode,
    status: 'stale',
    description: 'Project guide — Claude\'s operating manual for this repo',
    dependsOn: ['masterplan'],
    lastEdited: '3 days ago',
    changeCount: 4,
  },
  {
    id: 'design-guidelines',
    name: 'Design Guidelines',
    shortName: 'Design',
    icon: Palette,
    status: 'pending',
    description: 'Design tokens, spacing, typography, component specs',
    dependsOn: ['masterplan'],
    lastEdited: '1 day ago',
    changeCount: 2,
  },
  {
    id: 'app-flow',
    name: 'App Flow & Roles',
    shortName: 'App Flow',
    icon: GitBranch,
    status: 'up-to-date',
    description: 'Route tree, page inventory, role gates, user journeys',
    dependsOn: ['masterplan'],
    lastEdited: '5 hours ago',
  },
  {
    id: 'screen-flows',
    name: 'Screen Flows',
    shortName: 'Screens',
    icon: LayoutDashboard,
    status: 'stale',
    description: 'Screen layouts, components, navigation, states',
    dependsOn: ['app-flow', 'design-guidelines'],
    lastEdited: '4 days ago',
    changeCount: 7,
  },
  {
    id: 'feature-list',
    name: 'Feature List',
    shortName: 'Features',
    icon: ListChecks,
    status: 'not-created',
    description: 'Feature inventory, delivery status, strategic tags',
    dependsOn: ['masterplan', 'screen-flows'],
  },
  {
    id: 'operating-model',
    name: 'Operating Model',
    shortName: 'Ops Model',
    icon: Calculator,
    status: 'up-to-date',
    description: 'Revenue model, unit economics, thresholds, rules',
    dependsOn: ['masterplan'],
    lastEdited: '1 day ago',
  },
]

export const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bgColor: string }> = {
  'up-to-date': { label: 'Up to date', color: 'text-success', bgColor: 'bg-success/10' },
  stale: { label: 'Stale', color: 'text-warning', bgColor: 'bg-warning/10' },
  pending: { label: 'Pending changes', color: 'text-accent', bgColor: 'bg-accent/10' },
  draft: { label: 'Draft', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  'not-created': { label: 'Not created', color: 'text-muted-foreground', bgColor: 'bg-muted' },
}
