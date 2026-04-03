import { type ReactNode, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, CheckSquare, Trophy, BarChart3, Settings, PenLine, MoreHorizontal, X, BookOpen, BookHeart, Library, ChevronRight, ChevronDown, Sparkles, Scale, Languages, MessageCircle, Compass, Heart, History, Search, Eye } from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { TimerProvider } from '@/features/timer'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useSettings } from '@/components/settings'
import { ThemeSelector } from '@/components/ThemeSelector'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useViewAsNav } from '@/features/permissions/ViewAsModal'
import { WriteDrawerProvider, useWriteDrawer } from '@/hooks/useWriteDrawer'
import { WriteDrawer } from '@/components/guided/WriteDrawer'
import { ToolLauncherProvider, useToolLauncher } from '@/components/lila/ToolLauncherProvider'
import { useConversationHistory } from '@/hooks/useLila'
import type { LilaConversation } from '@/hooks/useLila'
import { LilaAvatar, getAvatarKeyForMode, getModeDisplayName } from '@/components/lila/LilaAvatar'

interface GuidedShellProps {
  children: ReactNode
}

/** Nav items that use NavLink routing */
const routeNavItems = [
  { path: '/dashboard', icon: <Home size={22} />, label: 'Home' },
  { path: '/tasks', icon: <CheckSquare size={22} />, label: 'Tasks' },
  // "Write" is handled separately as a drawer trigger (not a route)
  { path: '/trackers', icon: <BarChart3 size={22} />, label: 'Progress' },
]

export function GuidedShell({ children }: GuidedShellProps) {
  return (
    <ToolLauncherProvider>
      <WriteDrawerProvider>
        <TimerProvider>
          <GuidedShellInner>{children}</GuidedShellInner>
        </TimerProvider>
      </WriteDrawerProvider>
    </ToolLauncherProvider>
  )
}

function GuidedShellInner({ children }: { children: ReactNode }) {
  const { data: member } = useFamilyMember()
  const { openSettings } = useSettings()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const { openDrawer } = useWriteDrawer()

  // Show the viewed-as member's name when in View As mode
  const displayMember = isViewingAs && viewingAsMember ? viewingAsMember : member

  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
      >
        <div>
          <h1
            className="text-lg font-medium"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text-heading)' }}
          >
            {greeting}, {displayMember?.display_name || 'Friend'}!
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Write something">
            <button
              onClick={() => openDrawer('notepad')}
              className="p-2 rounded-full"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <PenLine size={20} />
            </button>
          </Tooltip>
          <ThemeSelector />
          <button
            onClick={openSettings}
            className="p-2 rounded-full"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Write Drawer — slides from right */}
      <WriteDrawer />

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-20">
        {children}
      </main>

      {/* Bottom navigation — View As-aware */}
      <GuidedBottomNav />
    </div>
  )
}

interface GuidedMoreItem {
  path: string
  icon: React.ReactNode
  label: string
  description: string
}

interface GuidedMoreSection {
  title: string
  items: GuidedMoreItem[]
}

/** More menu sections for Guided shell — navigation items */
const GUIDED_MORE_SECTIONS: GuidedMoreSection[] = [
  {
    title: 'Capture & Reflect',
    items: [
      { path: '/journal', icon: <BookOpen size={20} />, label: 'Journal', description: 'Capture thoughts and reflect' },
      { path: '/reflections', icon: <BookHeart size={20} />, label: 'Reflections', description: 'Daily reflection questions' },
      { path: '/victories', icon: <Trophy size={20} />, label: 'Victories', description: 'Celebrate your wins' },
    ],
  },
  {
    title: 'BookShelf',
    items: [
      { path: '/bookshelf', icon: <Library size={20} />, label: 'Library', description: 'Browse your book library' },
      { path: '/bookshelf/prompts', icon: <BookOpen size={20} />, label: 'Journal Prompts', description: 'Reflection prompts from books' },
    ],
  },
]

/** AI Tools that launch as modals — guided-appropriate tools */
const GUIDED_AI_TOOLS = [
  { modeKey: 'higgins_say', icon: <MessageCircle size={20} />, label: 'Help Me Say It', description: 'Figure out what to say to someone' },
  { modeKey: 'higgins_navigate', icon: <Compass size={20} />, label: 'Help Me Handle It', description: 'Work through a tricky situation' },
  { modeKey: 'gratitude', icon: <Heart size={20} />, label: 'Gratitude', description: 'Help saying thank you to someone' },
  { modeKey: 'decision_guide', icon: <Sparkles size={20} />, label: 'Decision Guide', description: 'Help thinking through a decision' },
  { modeKey: 'mediator', icon: <Scale size={20} />, label: 'Mediator', description: 'Work through a disagreement' },
  { modeKey: 'translator', icon: <Languages size={20} />, label: 'Translator', description: 'Rewrite something in a different tone' },
]

/** Bottom nav that works both in real routing and View As modal */
function GuidedBottomNav() {
  const { isViewingAs } = useViewAs()
  const { currentPath, navigate: viewAsNav } = useViewAsNav()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const [showConversationHistory, setShowConversationHistory] = useState(false)
  const [aiToolsExpanded, setAiToolsExpanded] = useState(false)
  const { openTool, resumeConversation } = useToolLauncher()
  const { data: member } = useFamilyMember()

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t py-2 z-20"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {routeNavItems.map((item, idx) => {
          const elements = []
          const isActive = isViewingAs
            ? currentPath === item.path
            : location.pathname === item.path

          if (isViewingAs) {
            elements.push(
              <button
                key={item.path}
                onClick={() => viewAsNav(item.path)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] min-h-[48px] justify-center"
                style={{
                  color: isActive ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
                  background: 'transparent',
                }}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </button>
            )
          } else {
            elements.push(
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] min-h-[48px] justify-center"
                style={({ isActive: active }) => ({
                  color: active ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
                })}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </NavLink>
            )
          }

          if (idx === 1) {
            elements.push(<WriteNavButton key="write" />)
          }

          return elements
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] min-h-[48px] justify-center"
          style={{
            color: moreOpen ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
            background: 'transparent',
          }}
        >
          <MoreHorizontal size={22} />
          <span className="text-xs">More</span>
        </button>
      </nav>

      {/* More menu — slide-up overlay */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-50 animate-fadeIn"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
              animation: 'guidedMoreSlideUp 200ms ease-out',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                More
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sectioned items */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70dvh - 56px)' }}>
              {GUIDED_MORE_SECTIONS.map((section) => (
                <div key={section.title} className="py-2">
                  <p
                    className="px-5 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.7 }}
                  >
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    if (isViewingAs) {
                      return (
                        <button
                          key={item.path}
                          onClick={() => { viewAsNav(item.path); setMoreOpen(false) }}
                          className="flex items-center gap-3 px-5 py-3 w-full text-left min-h-[48px]"
                          style={{
                            color: currentPath === item.path ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-primary)',
                            backgroundColor: currentPath === item.path ? 'var(--color-bg-secondary)' : 'transparent',
                          }}
                        >
                          <span style={{ color: 'var(--color-text-secondary)' }}>{item.icon}</span>
                          <div className="flex-1">
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {item.description}
                            </span>
                          </div>
                          <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
                        </button>
                      )
                    }
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 min-h-[48px]"
                        style={({ isActive }) => ({
                          color: isActive ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-primary)',
                          backgroundColor: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                          textDecoration: 'none',
                        })}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>{item.icon}</span>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {item.description}
                          </span>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
                      </NavLink>
                    )
                  })}
                </div>
              ))}

              {/* AI Tools — collapsible section, default collapsed */}
              <div className="py-2">
                <button
                  onClick={() => setAiToolsExpanded(prev => !prev)}
                  className="flex items-center justify-between w-full px-5 py-1.5"
                  style={{ background: 'transparent' }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--color-btn-primary-bg)', opacity: 0.7 }}
                  >
                    AI Tools
                  </span>
                  {aiToolsExpanded
                    ? <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
                    : <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
                  }
                </button>

                {aiToolsExpanded && (
                  <>
                    {GUIDED_AI_TOOLS.map((tool) => (
                      <button
                        key={tool.modeKey}
                        onClick={() => { openTool(tool.modeKey); setMoreOpen(false) }}
                        className="flex items-center gap-3 px-5 py-3 w-full text-left min-h-[48px]"
                        style={{ color: 'var(--color-text-primary)', background: 'transparent' }}
                      >
                        <span style={{ color: 'var(--color-text-secondary)' }}>{tool.icon}</span>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{tool.label}</span>
                          <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {tool.description}
                          </span>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
                      </button>
                    ))}
                  </>
                )}

                {/* My Conversations — always visible regardless of collapse state */}
                <button
                  onClick={() => { setShowConversationHistory(true); setMoreOpen(false) }}
                  className="flex items-center gap-3 px-5 py-3 w-full text-left min-h-[48px]"
                  style={{ color: 'var(--color-text-primary)', background: 'transparent' }}
                >
                  <span style={{ color: 'var(--color-text-secondary)' }}><History size={20} /></span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">My Conversations</span>
                    <span className="block text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      See and continue past conversations
                    </span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Conversation History — full-screen overlay */}
      {showConversationHistory && (
        <GuidedConversationHistory
          memberId={member?.id}
          onSelect={(conv) => { resumeConversation(conv); setShowConversationHistory(false) }}
          onClose={() => setShowConversationHistory(false)}
        />
      )}

      <style>{`
        @keyframes guidedMoreSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

/** Guided conversation history — full-screen overlay showing past tool conversations */
function GuidedConversationHistory({
  memberId,
  onSelect,
  onClose,
}: {
  memberId?: string
  onSelect: (conv: LilaConversation) => void
  onClose: () => void
}) {
  const { data: conversations = [] } = useConversationHistory(memberId, {})
  const [search, setSearch] = useState('')

  // Filter to tool conversations only + search
  const filtered = conversations.filter(c => {
    if (!(c.guided_mode || c.guided_subtype)) return false
    if (search) {
      const q = search.toLowerCase()
      return (c.title || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      <div
        className="fixed inset-0 z-50 animate-fadeIn"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex items-center gap-2">
            <History size={18} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              My Conversations
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ backgroundColor: 'var(--color-bg-card)' }}>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Transparency indicator */}
        <div
          className="px-4 py-1.5 text-xs flex items-center gap-1"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <Eye size={12} />
          Your parent can see these conversations
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {search ? 'No matching conversations.' : 'No conversations yet. Try one of the AI tools!'}
              </p>
            </div>
          ) : (
            filtered.map(conv => {
              const avatarKey = getAvatarKeyForMode(conv.mode || 'general')
              const modeLabel = getModeDisplayName(conv.mode, conv.guided_subtype)
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className="flex items-start gap-3 px-4 py-3 w-full text-left border-b min-h-12"
                  style={{ borderColor: 'var(--color-border)', background: 'transparent' }}
                >
                  <LilaAvatar avatarKey={avatarKey} size={16} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                    >
                      {modeLabel}
                    </span>
                    <p className="text-sm mt-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {conv.title || 'Untitled conversation'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(conv.updated_at).toLocaleDateString()} &middot; {conv.message_count} messages
                    </p>
                  </div>
                  <ChevronRight size={14} className="mt-2 shrink-0" style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

/** Write button in bottom nav — opens drawer instead of routing */
function WriteNavButton() {
  const { openDrawer, isOpen } = useWriteDrawer()

  // PRD-25 Phase C: Unread message badge placeholder — wired when PRD-15 is built
  const unreadCount = 0

  return (
    <button
      onClick={() => openDrawer('notepad')}
      className="relative flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] min-h-[48px] justify-center"
      style={{
        color: isOpen ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-text-secondary)',
        background: 'transparent',
      }}
    >
      <PenLine size={22} />
      <span className="text-xs">Write</span>
      {unreadCount > 0 && (
        <span
          className="absolute top-0.5 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
