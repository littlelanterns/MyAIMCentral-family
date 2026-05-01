import type { SupabaseClient } from '@supabase/supabase-js'

export async function cloneListTemplate(
  supabase: SupabaseClient,
  input: {
    sourceTemplateId: string
    newTitle: string
    familyId: string
    createdBy: string
  }
): Promise<{ newTemplateId: string }> {
  const { data: source, error: fetchErr } = await supabase
    .from('list_templates')
    .select('*')
    .eq('id', input.sourceTemplateId)
    .single()

  if (fetchErr || !source) {
    throw new Error(`Failed to fetch source template: ${fetchErr?.message ?? 'not found'}`)
  }

  const { data: newRow, error: insertErr } = await supabase
    .from('list_templates')
    .insert({
      family_id: input.familyId,
      created_by: input.createdBy,
      title: input.newTitle,
      template_name: input.newTitle,
      description: source.description,
      list_type: source.list_type,
      default_items: source.default_items,
      is_system: false,
      is_system_template: false,
      is_example: false,
      category_label: source.category_label,
    })
    .select('id')
    .single()

  if (insertErr || !newRow) {
    throw new Error(`Failed to insert cloned template: ${insertErr?.message ?? 'unknown'}`)
  }

  return { newTemplateId: newRow.id as string }
}
