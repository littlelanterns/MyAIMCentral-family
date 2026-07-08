/**
 * RecipeBox — PRD-42 KitchenCompass §6.2
 * Recipe library: keyword + semantic search, filter chips, sort, empty
 * states. Card tap opens Recipe Detail.
 */

import { useMemo, useState } from 'react'
import { Search, Plus, Star, Clock, Heart, HeartOff, ChefHat, Sparkles } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { RecipeCaptureModal } from './RecipeCaptureModal'
import { RecipeDetailModal } from './RecipeDetailModal'
import type { Recipe } from '@/types/meals'

type FilterChip = 'favorites' | 'traditions' | 'quick' | 'slow_cooker' | 'new'
type SortMode = 'recent' | 'most_made' | 'az'

interface RecipeBoxProps {
  familyId: string
  memberId: string
  isTeen?: boolean
}

export function RecipeBox({ familyId, memberId, isTeen = false }: RecipeBoxProps) {
  const { data: recipes = [], isLoading } = useRecipes(familyId)
  const [search, setSearch] = useState('')
  const [activeChips, setActiveChips] = useState<Set<FilterChip>>(new Set())
  const [sort, setSort] = useState<SortMode>('recent')
  const [captureOpen, setCaptureOpen] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)

  const toggleChip = (chip: FilterChip) => {
    setActiveChips((prev) => {
      const next = new Set(prev)
      if (next.has(chip)) next.delete(chip)
      else next.add(chip)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = recipes
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.ingredients.some((i) => i.item?.toLowerCase().includes(q)),
      )
    }
    if (activeChips.has('favorites')) list = list.filter((r) => r.rotation === 'favorite')
    if (activeChips.has('traditions')) list = list.filter((r) => r.tradition_tags.length > 0)
    if (activeChips.has('quick')) list = list.filter((r) => r.effort_level === 'quick' || (r.total_minutes ?? 999) <= 30)
    if (activeChips.has('slow_cooker')) list = list.filter((r) => r.equipment_tags.includes('slow_cooker'))
    if (activeChips.has('new')) list = list.filter((r) => r.times_made === 0)

    const sorted = [...list]
    if (sort === 'most_made') sorted.sort((a, b) => b.times_made - a.times_made)
    else if (sort === 'az') sorted.sort((a, b) => a.title.localeCompare(b.title))
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return sorted
  }, [recipes, search, activeChips, sort])

  const chips: { key: FilterChip; label: string }[] = [
    { key: 'favorites', label: 'Favorites' },
    { key: 'traditions', label: 'Traditions' },
    { key: 'quick', label: 'Quick (≤30 min)' },
    { key: 'slow_cooker', label: 'Slow cooker' },
    { key: 'new', label: 'New' },
  ]

  return (
    <div className="density-compact space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="recent">Recently added</option>
          <option value="most_made">Most made</option>
          <option value="az">A-Z</option>
        </select>
        <button onClick={() => setCaptureOpen(true)} className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
          <Plus size={16} /> Add Recipe
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => toggleChip(c.key)}
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: activeChips.has(c.key) ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
              color: activeChips.has(c.key) ? 'var(--color-text-on-primary, white)' : 'var(--color-text-secondary)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading your recipes...</div>
      )}

      {!isLoading && recipes.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <ChefHat size={40} className="mx-auto" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Add your first recipe — paste it, snap it, or link it.
          </p>
          <button onClick={() => setCaptureOpen(true)} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium">
            <Sparkles size={16} /> Add a Recipe
          </button>
        </div>
      )}

      {!isLoading && recipes.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No recipes match those filters.
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onOpen={() => setSelectedRecipeId(recipe.id)} />
          ))}
        </div>
      )}

      <RecipeCaptureModal
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
        familyId={familyId}
        memberId={memberId}
        isTeen={isTeen}
        onRecipeCreated={(id) => setSelectedRecipeId(id)}
      />

      {selectedRecipeId && (
        <RecipeDetailModal
          recipeId={selectedRecipeId}
          familyId={familyId}
          memberId={memberId}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}
    </div>
  )
}

function RecipeCard({ recipe, onOpen }: { recipe: Recipe; onOpen: () => void }) {
  const photo = recipe.photo_urls[0]
  return (
    <button
      onClick={onOpen}
      className="text-left rounded-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      <div className="h-32 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-tertiary, var(--color-bg))' }}>
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <ChefHat size={28} style={{ color: 'var(--color-text-secondary)' }} />
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{recipe.title}</span>
          {recipe.is_included_in_ai ? (
            <Heart size={14} className="shrink-0 mt-0.5" fill="currentColor" style={{ color: 'var(--color-accent)' }} />
          ) : (
            <HeartOff size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {recipe.effort_level && <span className="capitalize">{recipe.effort_level}</span>}
          {recipe.total_minutes && (
            <span className="flex items-center gap-0.5"><Clock size={11} /> {recipe.total_minutes}m</span>
          )}
          {recipe.times_made > 0 && <span>Made {recipe.times_made}×</span>}
          {recipe.rotation === 'favorite' && <Star size={12} fill="currentColor" style={{ color: 'var(--color-accent)' }} />}
        </div>
        {recipe.approval_status === 'suggested' && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
            Waiting for mom
          </span>
        )}
      </div>
    </button>
  )
}
