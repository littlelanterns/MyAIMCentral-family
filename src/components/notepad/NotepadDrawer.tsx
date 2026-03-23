import { useState } from 'react'
import { StickyNote, Plus, X, Trash2 } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'

/**
 * Smart Notepad — right-side pull-out drawer (PRD-08, Zone 3).
 * Always-on capture workspace with tabs.
 * Mom + Adult + Independent shells get this; Guided and Play do not.
 *
 * In preview mode (no auth), tabs are local state only.
 * When connected to Supabase, uses useNotepadTabs hook.
 */

interface NotepadTab {
  id: string
  title: string
  content: string
}

const DEFAULT_TABS: NotepadTab[] = [
  { id: 'inbox', title: 'Inbox', content: '' },
  { id: 'focus', title: "Today's Focus", content: '' },
]

export function NotepadDrawer() {
  const [expanded, setExpanded] = useState(false)
  const [tabs, setTabs] = useState<NotepadTab[]>(DEFAULT_TABS)
  const [activeTabId, setActiveTabId] = useState(DEFAULT_TABS[0].id)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0]

  function updateTabContent(content: string) {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content } : t))
  }

  function addTab() {
    const newTab: NotepadTab = {
      id: crypto.randomUUID(),
      title: `Note ${tabs.length + 1}`,
      content: '',
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }

  function deleteTab(id: string) {
    if (tabs.length <= 1) return
    setTabs(prev => prev.filter(t => t.id !== id))
    if (activeTabId === id) {
      setActiveTabId(tabs.find(t => t.id !== id)?.id ?? tabs[0].id)
    }
  }

  function renameTab(id: string, title: string) {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, title } : t))
    setEditingTitle(null)
  }

  return (
    <div
      className="fixed top-0 right-0 bottom-0 z-20 hidden md:flex"
      style={{ pointerEvents: 'none' }}
    >
      {/* Pull tab — icon only, right edge */}
      <Tooltip content="Notepad">
        <button
          onClick={() => setExpanded(!expanded)}
          className="self-center p-2 rounded-l-lg"
          style={{
            pointerEvents: 'auto',
            backgroundColor: 'var(--color-accent)',
            color: '#ffffff',
          }}
        >
          <StickyNote size={16} />
        </button>
      </Tooltip>

      {/* Drawer body */}
      <div
        className="flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          pointerEvents: expanded ? 'auto' : 'none',
          width: expanded ? '320px' : '0px',
          backgroundColor: 'var(--color-bg-card)',
          borderLeft: expanded ? '1px solid var(--color-border)' : 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <StickyNote size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
              Smart Notepad
            </span>
          </div>
          <button onClick={() => setExpanded(false)} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 px-2 py-1.5 border-b overflow-x-auto shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {tabs.map(tab => (
            <div key={tab.id} className="flex items-center shrink-0">
              {editingTitle === tab.id ? (
                <input
                  type="text"
                  defaultValue={tab.title}
                  autoFocus
                  onBlur={(e) => renameTab(tab.id, e.target.value || tab.title)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameTab(tab.id, (e.target as HTMLInputElement).value || tab.title)
                    if (e.key === 'Escape') setEditingTitle(null)
                  }}
                  className="px-1.5 py-0.5 rounded text-xs w-16"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border-focus)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              ) : (
                <button
                  onClick={() => setActiveTabId(tab.id)}
                  onDoubleClick={() => setEditingTitle(tab.id)}
                  className="px-2 py-1 rounded text-xs whitespace-nowrap"
                  style={{
                    backgroundColor: activeTabId === tab.id ? 'var(--color-bg-secondary)' : 'transparent',
                    color: activeTabId === tab.id ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
                    fontWeight: activeTabId === tab.id ? 500 : 400,
                  }}
                  title="Double-click to rename"
                >
                  {tab.title}
                </button>
              )}
              {tabs.length > 1 && activeTabId === tab.id && (
                <button
                  onClick={() => deleteTab(tab.id)}
                  className="p-0.5 ml-0.5 rounded opacity-50 hover:opacity-100"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="p-1 rounded shrink-0"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Add tab"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0">
          <textarea
            value={activeTab?.content ?? ''}
            onChange={(e) => updateTabContent(e.target.value)}
            placeholder="Capture anything here... thoughts, ideas, quick notes."
            className="flex-1 p-3 text-sm resize-none"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              border: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* Footer — word count + Review & Route stub */}
        <div
          className="flex items-center justify-between px-3 py-2 border-t text-xs shrink-0"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <span>
            {(activeTab?.content ?? '').split(/\s+/).filter(Boolean).length} words
          </span>
          {/* STUB: Review & Route button — wires to PRD-08 extraction pipeline */}
          <button
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
            }}
            title="Extract items and route to features (coming soon)"
          >
            Review & Route
          </button>
        </div>
      </div>
    </div>
  )
}
