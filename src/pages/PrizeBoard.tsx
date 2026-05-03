import { Gift, Check, Loader2 } from 'lucide-react'
import { useEarnedPrizes, useRedeemPrize } from '@/hooks/useEarnedPrizes'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'

export default function PrizeBoard() {
  const { data: currentMember } = useFamilyMember()
  const familyId = currentMember?.family_id
  const { data: prizes = [], isLoading } = useEarnedPrizes()
  const { data: members = [] } = useFamilyMembers(familyId)
  const redeemMutation = useRedeemPrize()

  const memberMap = new Map(members.map(m => [m.id, m]))

  const grouped = prizes.reduce<Record<string, typeof prizes>>((acc, prize) => {
    const key = prize.family_member_id
    if (!acc[key]) acc[key] = []
    acc[key].push(prize)
    return acc
  }, {})

  const handleRedeem = (prizeId: string) => {
    if (!currentMember?.id) return
    redeemMutation.mutate({ prizeId, redeemedBy: currentMember.id })
  }

  if (isLoading) {
    return (
      <div className="density-compact p-4 md:p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="animate-spin" size={24} />
      </div>
    )
  }

  return (
    <div className="density-compact p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Gift size={24} className="text-[var(--color-accent)]" />
        <h1 className="text-xl font-semibold">Prize Board</h1>
      </div>

      {prizes.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border-default)] p-8 text-center">
          <Gift size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-[var(--color-text-secondary)]">
            No unredeemed prizes yet. When contracts award prizes, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([memberId, memberPrizes]) => {
            const member = memberMap.get(memberId)
            const color = member ? getMemberColor(member) : 'var(--color-accent)'

            return (
              <div key={memberId}>
                <div
                  className="flex items-center gap-2 mb-3 pb-2 border-b"
                  style={{ borderColor: color }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium">
                    {member?.display_name ?? 'Unknown'}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    ({memberPrizes.length} unredeemed)
                  </span>
                </div>

                <div className="space-y-2">
                  {memberPrizes.map(prize => (
                    <div
                      key={prize.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]"
                    >
                      {prize.prize_image_url ? (
                        <img
                          src={prize.prize_image_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded flex items-center justify-center bg-[var(--color-bg-tertiary)]">
                          <Gift size={18} className="opacity-50" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {prize.prize_name ?? prize.prize_text ?? 'Prize'}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Earned {new Date(prize.earned_at).toLocaleDateString()}
                          {prize.source_type && ` via ${prize.source_type.replace(/_/g, ' ')}`}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRedeem(prize.id)}
                        disabled={redeemMutation.isPending}
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Check size={14} />
                        Redeemed
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
