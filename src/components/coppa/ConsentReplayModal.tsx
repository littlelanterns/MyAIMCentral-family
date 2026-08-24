/**
 * PRD-40 Slice 4 — Screen 8's "[Review what I consented to]" / "[View
 * original consent record]" audit replay: the EXACT disclosure text version
 * mom acknowledged, loaded from coppa_consent_templates by consent_version
 * (never re-rendered from the CURRENT template — a mom who consented under
 * v1.0.0 always sees v1.0.0, even after a later version replaces it).
 */

import { useQuery } from '@tanstack/react-query'
import { BookOpen, Loader } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { supabase } from '@/lib/supabase/client'
import { ConsentSectionBody } from '@/lib/coppa/consentText'

interface Props {
  isOpen: boolean
  onClose: () => void
  consentVersion: string
  childName: string
}

const SECTIONS: Array<{ key: 'section_what_we_collect' | 'section_how_lila_uses' | 'section_who_sees_it' | 'section_your_rights' | 'section_parent_affirmation'; title: string }> = [
  { key: 'section_what_we_collect', title: 'What We Collect' },
  { key: 'section_how_lila_uses', title: 'How LiLa Uses This' },
  { key: 'section_who_sees_it', title: 'Who Sees It' },
  { key: 'section_your_rights', title: 'Your Rights' },
  { key: 'section_parent_affirmation', title: 'Parent Affirmation' },
]

export function ConsentReplayModal({ isOpen, onClose, consentVersion, childName }: Props) {
  const { data: template, isLoading } = useQuery({
    queryKey: ['coppa-consent-template-replay', consentVersion],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coppa_consent_templates')
        .select('*')
        .eq('version', consentVersion)
        .single()
      if (error) throw error
      return data
    },
    enabled: isOpen,
  })

  return (
    <ModalV2
      id="coppa-consent-replay"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={`What You Consented To — ${childName}`}
      subtitle={`Version ${consentVersion}`}
      icon={BookOpen}
    >
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader size={20} className="animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      )}
      {template && (
        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
          {SECTIONS.map((s) => (
            <div key={s.key}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>{s.title}</p>
              <ConsentSectionBody text={template[s.key]} childNames={[childName]} />
            </div>
          ))}
        </div>
      )}
    </ModalV2>
  )
}
