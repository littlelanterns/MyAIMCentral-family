import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface SavedPrompt {
  id: string
  user_id: string
  title: string
  prompt_text: string
  source_vault_item_id: string | null
  source_prompt_entry_id: string | null
  is_lila_optimized: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export function useSavedPrompts(memberId: string | null) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!memberId) return
    const { data } = await supabase
      .from('user_saved_prompts')
      .select('*')
      .eq('user_id', memberId)
      .order('created_at', { ascending: false })
    if (data) setPrompts(data)
    setLoading(false)
  }, [memberId])

  useEffect(() => { load() }, [load])

  const createPrompt = async (input: { title: string; prompt_text: string; tags?: string[]; source_vault_item_id?: string; source_prompt_entry_id?: string; is_lila_optimized?: boolean }) => {
    if (!memberId) return
    const { data } = await supabase
      .from('user_saved_prompts')
      .insert({ user_id: memberId, ...input, tags: input.tags || [] })
      .select()
      .single()
    if (data) setPrompts(prev => [data, ...prev])
    return data
  }

  const updatePrompt = async (id: string, updates: Partial<Pick<SavedPrompt, 'title' | 'prompt_text' | 'tags'>>) => {
    const { data } = await supabase
      .from('user_saved_prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (data) setPrompts(prev => prev.map(p => p.id === id ? data : p))
  }

  const deletePrompt = async (id: string) => {
    await supabase.from('user_saved_prompts').delete().eq('id', id)
    setPrompts(prev => prev.filter(p => p.id !== id))
  }

  const copyPrompt = async (prompt: SavedPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text)
      // Log copy event if from vault
      if (prompt.source_vault_item_id && memberId) {
        supabase.from('vault_copy_events').insert({
          user_id: memberId,
          vault_item_id: prompt.source_vault_item_id,
          prompt_entry_id: prompt.source_prompt_entry_id,
        }).then(() => {})
      }
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = prompt.prompt_text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  return { prompts, loading, createPrompt, updatePrompt, deletePrompt, copyPrompt }
}
