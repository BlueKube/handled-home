import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { BigPictureView } from '@/components/BigPictureView'
import { DocumentEditor } from '@/components/DocumentEditor'
import { PersonaFeed } from '@/components/PersonaFeed'
import { TopBar } from '@/components/TopBar'

export type ActiveView =
  | { type: 'big-picture' }
  | { type: 'document'; docId: string }
  | { type: 'personas' }

function App() {
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'big-picture' })
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar
            activeView={activeView}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
          />
          <main className="flex-1 overflow-auto">
            {activeView.type === 'big-picture' && (
              <BigPictureView onNavigate={setActiveView} />
            )}
            {activeView.type === 'document' && (
              <DocumentEditor docId={activeView.docId} />
            )}
            {activeView.type === 'personas' && (
              <PersonaFeed />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
