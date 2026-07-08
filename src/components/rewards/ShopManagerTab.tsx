/**
 * ShopManagerTab — Prize Board "Shop" tab (mom + reward_rules-granted
 * adults). PRD-24 Point Economy Addendum §7.3.
 *
 * Item catalog CRUD, Bulk Add with AI (#252 — mandatory on any multi-item
 * creation surface; the AI extracts BOTH a name and a point cost per line,
 * HITM-reviewed in BulkAddWithAI's own preview step before anything saves),
 * a pending-purchases strip with inline approve/decline (a direct, better
 * UX substitute for "jump to Queue" — the RequestsTab StorePurchaseCard
 * covers the same ground for mom's normal Queue workflow; this strip lets
 * her act without leaving the Shop tab), and purchase history.
 */

import { useState } from 'react'
import { Gift, Plus, Sparkles, Pencil, Archive, Check, X, Users, Lock, Clock } from 'lucide-react'
import { FeatureGuide } from '@/components/shared'
import { BulkAddWithAI, type ParsedBulkItem } from '@/components/shared/BulkAddWithAI'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import {
  useRewardShopItemsAll,
  useCreateRewardShopItem,
  useToggleRewardShopItemActive,
  useArchiveRewardShopItem,
  usePendingRewardShopPurchases,
  useRewardShopPurchaseHistory,
  useResolveRewardShopPurchase,
} from '@/hooks/useRewardShop'
import { ShopItemEditorModal } from '@/components/rewards/ShopItemEditorModal'
import { getMemberColor } from '@/lib/memberColors'
import type { RewardShopItem } from '@/types/reward-shop'

/** Bulk-add regex: "<Name> — <cost>" (also tolerates a plain hyphen). */
const REWARD_BULK_LINE = /^(.*?)\s*[—-]\s*(\d+)\s*(?:points?)?\s*$/i

function parseRewardBulkItem(text: string): { name: string; cost: number } {
  const match = text.match(REWARD_BULK_LINE)
  if (match) {
    return { name: match[1].trim(), cost: parseInt(match[2], 10) }
  }
  return { name: text.trim(), cost: 50 }
}

export function ShopManagerTab({ familyId }: { familyId: string }) {
  const { data: currentMember } = useFamilyMember()
  const { data: members = [] } = useFamilyMembers(familyId)
  const { data: items = [], isLoading } = useRewardShopItemsAll(familyId)
  const { data: pending = [] } = usePendingRewardShopPurchases(familyId)
  const { data: history = [] } = useRewardShopPurchaseHistory(familyId)

  const createItem = useCreateRewardShopItem()
  const toggleActive = useToggleRewardShopItemActive()
  const archiveItem = useArchiveRewardShopItem()
  const resolvePurchase = useResolveRewardShopPurchase()

  const [editingItem, setEditingItem] = useState<RewardShopItem | 'new' | null>(null)
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const memberMap = new Map(members.map((m) => [m.id, m]))
  const activeItems = items.filter((i) => !i.archived_at)

  const handleBulkSave = async (parsedItems: ParsedBulkItem[]) => {
    if (!currentMember?.id) return
    for (const parsed of parsedItems) {
      const { name, cost } = parseRewardBulkItem(parsed.text)
      if (!name) continue
      await createItem.mutateAsync({
        familyId,
        createdBy: currentMember.id,
        name,
        pointCost: cost,
        requiresApproval: true,
        audienceMemberIds: [],
      })
    }
  }

  const resolvedHistory = history.filter((p) => p.status !== 'pending')

  return (
    <div className="space-y-6" data-testid="shop-manager-tab">
      <FeatureGuide featureKey="reward_shop" />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          data-testid="shop-add-item"
          onClick={() => setEditingItem('new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          <Plus size={16} /> Add Reward
        </button>
        <button
          type="button"
          data-testid="shop-bulk-add"
          onClick={() => setBulkAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <Sparkles size={16} /> Bulk Add with AI
        </button>
      </div>

      {bulkAddOpen && (
        <BulkAddWithAI
          title="Bulk Add Rewards"
          placeholder={'Movie night 200\nExtra screen time 50\nIce cream 75\nPick dinner 100'}
          hint="One reward per line — name and point cost. The AI sorts out amounts if you leave some blank."
          parsePrompt="Parse each reward or privilege the user describes, along with its point cost. Return each as a single string in the exact format '<Name> — <cost>' (an em dash then the point cost as a plain integer, no currency symbol, no word 'points'). If a cost isn't given for an item, guess a reasonable one between 25 and 200 based on how big a treat it sounds like."
          onSave={handleBulkSave}
          onClose={() => setBulkAddOpen(false)}
        />
      )}

      {/* Pending purchases strip — inline approve/decline */}
      {pending.length > 0 && (
        <div
          data-testid="shop-pending-strip"
          className="rounded-xl p-4 space-y-2"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              Waiting for your approval ({pending.length})
            </p>
          </div>
          {pending.map((purchase) => {
            const member = memberMap.get(purchase.family_member_id)
            return (
              <div
                key={purchase.id}
                data-testid={`shop-pending-row-${purchase.id}`}
                className="flex items-center gap-3 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: member ? getMemberColor(member) : 'var(--color-accent)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {member?.display_name ?? 'Someone'} wants {purchase.item_name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {purchase.points_cost} points
                  </p>
                </div>
                <button
                  type="button"
                  data-testid={`shop-approve-${purchase.id}`}
                  onClick={() =>
                    resolvePurchase.mutate({
                      purchaseId: purchase.id,
                      action: 'approve',
                      processedBy: currentMember?.id ?? '',
                      familyId,
                      memberId: purchase.family_member_id,
                    })
                  }
                  disabled={resolvePurchase.isPending}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
                >
                  <Check size={13} /> Approve
                </button>
                <button
                  type="button"
                  data-testid={`shop-decline-${purchase.id}`}
                  onClick={() =>
                    resolvePurchase.mutate({
                      purchaseId: purchase.id,
                      action: 'decline',
                      processedBy: currentMember?.id ?? '',
                      familyId,
                      memberId: purchase.family_member_id,
                    })
                  }
                  disabled={resolvePurchase.isPending}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  <X size={13} /> Not this time
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Catalog */}
      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : activeItems.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border-default)] p-8 text-center">
          <Gift size={32} className="mx-auto mb-3 opacity-40" />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No rewards in the shop yet. Add one, or bulk-add a whole list.
          </p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="shop-item-list">
          {activeItems.map((item) => (
            <ShopItemRow
              key={item.id}
              item={item}
              members={members}
              onEdit={() => setEditingItem(item)}
              onToggleActive={() => toggleActive.mutate({ itemId: item.id, familyId, isActive: !item.is_active })}
              onArchive={() => archiveItem.mutate({ itemId: item.id, familyId })}
            />
          ))}
        </div>
      )}

      {/* History */}
      {resolvedHistory.length > 0 && (
        <div>
          <button
            type="button"
            data-testid="shop-history-toggle"
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm font-medium underline-offset-2 hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {showHistory ? 'Hide purchase history' : `Purchase history (${resolvedHistory.length})`}
          </button>
          {showHistory && (
            <div className="space-y-1.5 mt-2">
              {resolvedHistory.map((p) => {
                const member = memberMap.get(p.family_member_id)
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: member ? getMemberColor(member) : 'var(--color-accent)' }} />
                    <span className="flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {member?.display_name ?? 'Someone'} — {p.item_name}
                    </span>
                    <span
                      className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          p.status === 'declined' || p.status === 'cancelled'
                            ? 'transparent'
                            : 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                        color: p.status === 'declined' || p.status === 'cancelled' ? 'var(--color-text-secondary)' : 'var(--color-btn-primary-bg)',
                      }}
                    >
                      {p.status === 'auto_approved' ? 'approved' : p.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {editingItem && (
        <ShopItemEditorModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          familyId={familyId}
          createdBy={currentMember?.id ?? ''}
          item={editingItem === 'new' ? null : editingItem}
        />
      )}
    </div>
  )
}

function ShopItemRow({
  item,
  members,
  onEdit,
  onToggleActive,
  onArchive,
}: {
  item: RewardShopItem
  members: { id: string; display_name: string; assigned_color?: string | null; member_color?: string | null; calendar_color?: string | null }[]
  onEdit: () => void
  onToggleActive: () => void
  onArchive: () => void
}) {
  const audienceNames =
    item.audience_member_ids.length === 0
      ? 'Everyone'
      : item.audience_member_ids
          .map((id) => members.find((m) => m.id === id)?.display_name)
          .filter(Boolean)
          .join(', ')

  return (
    <div
      data-testid={`shop-item-row-${item.id}`}
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        opacity: item.is_active ? 1 : 0.55,
      }}
    >
      {item.image_url ? (
        <img src={item.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
      ) : item.image_asset_key ? (
        <PlatformAssetImage
          assetKey={item.image_asset_key}
          size={40}
          assetSize={128}
          variant="B"
          fallback={<div className="w-10 h-10 rounded flex items-center justify-center bg-[var(--color-bg-tertiary)]"><Gift size={18} className="opacity-50" /></div>}
        />
      ) : (
        <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
          <Gift size={18} className="opacity-50" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{item.name}</p>
        <div className="flex items-center gap-2 flex-wrap text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--color-btn-primary-bg)' }}>{item.point_cost} pts</span>
          <span className="flex items-center gap-1"><Users size={11} /> {audienceNames}</span>
          {item.requires_approval && <span>needs approval</span>}
          {item.limit_per_member && <span>{item.limit_per_member}/{item.limit_period}</span>}
          {item.unlock_rule && (
            <span className="flex items-center gap-1"><Lock size={11} /> {item.unlock_rule.threshold}%+ weeks</span>
          )}
          {!item.is_active && <span>(hidden)</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        title="Edit"
        aria-label={`Edit ${item.name}`}
        className="shrink-0 p-1.5 rounded hover:opacity-70"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={onToggleActive}
        data-testid={`shop-item-toggle-active-${item.id}`}
        title={item.is_active ? 'Hide from kids' : 'Show to kids'}
        aria-label={item.is_active ? `Hide ${item.name}` : `Show ${item.name}`}
        className="shrink-0 px-2 py-1 rounded text-xs font-medium border"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        {item.is_active ? 'Hide' : 'Show'}
      </button>
      <button
        type="button"
        onClick={onArchive}
        title="Archive"
        aria-label={`Archive ${item.name}`}
        className="shrink-0 p-1.5 rounded hover:opacity-70"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <Archive size={15} />
      </button>
    </div>
  )
}
