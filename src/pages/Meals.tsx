/**
 * Meals — PRD-42 KitchenCompass, top-level page at /meals
 *
 * Two tabs: This Week (default) and Recipe Box. Registered once in
 * getSidebarSections() under Plan & Do (Convention #16).
 */

import { useState } from 'react'
import { ChefHat, ShieldAlert } from 'lucide-react'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { useManagementGrants } from '@/lib/permissions/useManagementGrants'
import { ThisWeekPlan } from '@/components/meals/ThisWeekPlan'
import { RecipeBox } from '@/components/meals/RecipeBox'
import { FoodProfilesModal } from '@/components/meals/FoodProfilesModal'

type Tab = 'this_week' | 'recipe_box'

export default function Meals() {
  const { member } = useEffectiveMember()
  const grants = useManagementGrants()
  const [tab, setTab] = useState<Tab>('this_week')
  const [showFoodProfiles, setShowFoodProfiles] = useState(false)

  if (!member) return null

  const familyId = member.family_id
  const memberId = member.id
  const isMom = member.role === 'primary_parent'
  const isTeen = member.dashboard_mode === 'independent'
  const isMomOrGrant = isMom || grants.mealPlanningLevel !== 'none'

  return (
    <div className="density-compact max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <ChefHat size={22} /> KitchenCompass
        </h1>
        {isMomOrGrant && (
          <button
            onClick={() => setShowFoodProfiles(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          >
            <ShieldAlert size={14} /> Food Profiles
          </button>
        )}
      </div>

      <FeatureGuide featureKey="meals_basic" />

      <div className="flex gap-2 mb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <TabButton label="This Week" active={tab === 'this_week'} onClick={() => setTab('this_week')} />
        <TabButton label="Recipe Box" active={tab === 'recipe_box'} onClick={() => setTab('recipe_box')} />
      </div>

      {tab === 'this_week' && <ThisWeekPlan familyId={familyId} memberId={memberId} isMomOrGrant={isMomOrGrant} />}
      {tab === 'recipe_box' && <RecipeBox familyId={familyId} memberId={memberId} isTeen={isTeen} />}

      {showFoodProfiles && (
        <FoodProfilesModal familyId={familyId} memberId={memberId} isMomOrGrant={isMomOrGrant} onClose={() => setShowFoodProfiles(false)} />
      )}
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-sm font-medium -mb-px border-b-2"
      style={{
        borderColor: active ? 'var(--color-accent)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
      }}
    >
      {label}
    </button>
  )
}
