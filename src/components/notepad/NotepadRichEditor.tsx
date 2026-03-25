/**
 * NotepadRichEditor — Light rich text editor for Smart Notepad (PRD-08)
 *
 * Uses tiptap with StarterKit for bold, italic, and bullet list formatting.
 * Three-button toolbar only. Saves as HTML. Autosaves via onChange callback.
 */

import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List } from 'lucide-react'

interface NotepadRichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export function NotepadRichEditor({
  content,
  onChange,
  placeholder = 'Capture anything here... thoughts, ideas, quick notes.',
  autoFocus = false,
}: NotepadRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need — keep it light
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        hardBreak: { keepMarks: true },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'notepad-editor-content',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    autofocus: autoFocus ? 'end' : false,
  })

  // Sync content from parent when tab changes (content prop changes externally)
  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    // Only update if content actually changed (avoid cursor reset)
    if (content !== currentHtml) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  // Focus helper for external trigger
  useEffect(() => {
    if (autoFocus && editor) {
      setTimeout(() => editor.commands.focus('end'), 100)
    }
  }, [autoFocus, editor])

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Formatting toolbar — 3 buttons only */}
      <div
        className="flex items-center gap-0.5 px-2 py-1 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <ToolbarButton
          onClick={toggleBold}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleItalic}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleBulletList}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={14} />
        </ToolbarButton>
      </div>

      {/* Editor content area */}
      <EditorContent
        editor={editor}
        className="flex-1 overflow-y-auto min-h-0"
      />
    </div>
  )
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void
  isActive: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded transition-colors"
      style={{
        color: isActive ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
        backgroundColor: isActive ? 'var(--color-btn-primary-bg)' : 'transparent',
        minHeight: 'unset',
      }}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}
