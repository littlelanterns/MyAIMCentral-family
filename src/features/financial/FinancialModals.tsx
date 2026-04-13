// PRD-28 Screens 8, 9, 10: Payment, Loan, Purchase Deduction modals

import { useState } from 'react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useCreatePayment, useCreateLoan, useCreateDeduction, useRunningBalance } from '@/hooks/useFinancial'

// ============================================================
// Screen 8: Payment Confirmation Modal
// ============================================================

export function PaymentModal({
  isOpen,
  onClose,
  familyId,
  memberId,
  memberName,
}: {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  memberName: string
}) {
  const { data: balance } = useRunningBalance(memberId)
  const createPayment = useCreatePayment()
  const [mode, setMode] = useState<'full' | 'partial'>('full')
  const [partialAmount, setPartialAmount] = useState('')
  const [note, setNote] = useState('')

  const currentBalance = balance ?? 0
  const payAmount = mode === 'full' ? currentBalance : Number(partialAmount) || 0

  const handleConfirm = async () => {
    if (payAmount <= 0) return
    await createPayment.mutateAsync({
      family_id: familyId,
      family_member_id: memberId,
      amount: payAmount,
      note: note || undefined,
    })
    onClose()
  }

  return (
    <ModalV2
      id="payment-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Mark as Paid"
      type="transient"
      size="sm"
    >
      <div className="space-y-4 p-4">
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Paying: <span className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>{memberName}</span> — ${currentBalance.toFixed(2)}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Cash — from birthday shopping trip"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>
            Amount to pay
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'full'}
                onChange={() => setMode('full')}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Full balance (${currentBalance.toFixed(2)})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'partial'}
                onChange={() => setMode('partial')}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Partial amount:</span>
              {mode === 'partial' && (
                <div className="flex items-center gap-1">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>$</span>
                  <input
                    type="number"
                    value={partialAmount}
                    onChange={e => setPartialAmount(e.target.value)}
                    min={0.01}
                    max={currentBalance}
                    step={0.01}
                    className="w-24 px-2 py-1 rounded text-sm"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                    }}
                    autoFocus
                  />
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={payAmount <= 0 || createPayment.isPending}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {createPayment.isPending ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </ModalV2>
  )
}

// ============================================================
// Screen 9: Loan Creation Modal
// ============================================================

export function LoanModal({
  isOpen,
  onClose,
  familyId,
  memberId,
  memberName,
  maxAmount,
}: {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  memberName: string
  maxAmount?: number | null
}) {
  const createLoan = useCreateLoan()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [repaymentMode, setRepaymentMode] = useState<'manual' | 'auto_deduct'>('auto_deduct')
  const [autoDeductAmount, setAutoDeductAmount] = useState('')
  const [interestEnabled, setInterestEnabled] = useState(false)
  const [interestRate, setInterestRate] = useState('2')
  const [interestPeriod, setInterestPeriod] = useState<'weekly' | 'monthly'>('monthly')

  const loanAmount = Number(amount) || 0

  const handleCreate = async () => {
    if (loanAmount <= 0) return
    if (maxAmount && loanAmount > maxAmount) return

    await createLoan.mutateAsync({
      family_id: familyId,
      family_member_id: memberId,
      amount: loanAmount,
      reason: reason || undefined,
      repayment_mode: repaymentMode,
      auto_deduct_amount: repaymentMode === 'auto_deduct' ? (Number(autoDeductAmount) || undefined) : undefined,
      interest_rate: interestEnabled ? (Number(interestRate) || 0) : 0,
      interest_period: interestPeriod,
    })
    onClose()
  }

  return (
    <ModalV2
      id="loan-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Create Loan"
      type="transient"
      size="sm"
    >
      <div className="space-y-4 p-4">
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Borrower: <span className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>{memberName}</span>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>Amount</label>
          <div className="flex items-center gap-1">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={0.01}
              max={maxAmount ?? undefined}
              step={0.01}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Advance for video game — will repay from allowance"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {/* Repayment */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>Repayment</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={repaymentMode === 'manual'} onChange={() => setRepaymentMode('manual')} />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Manual (I'll track repayments myself)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={repaymentMode === 'auto_deduct'} onChange={() => setRepaymentMode('auto_deduct')} />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Auto-deduct from allowance</span>
            </label>
            {repaymentMode === 'auto_deduct' && (
              <div className="flex items-center gap-1 ml-6">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>$</span>
                <input
                  type="number"
                  value={autoDeductAmount}
                  onChange={e => setAutoDeductAmount(e.target.value)}
                  placeholder="4.00"
                  min={0.01}
                  step={0.01}
                  className="w-24 px-2 py-1 rounded text-sm"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>/week</span>
              </div>
            )}
          </div>
        </div>

        {/* Interest */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>Interest</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!interestEnabled} onChange={() => setInterestEnabled(false)} />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>None</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={interestEnabled} onChange={() => setInterestEnabled(true)} />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Add interest:</span>
              {interestEnabled && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={interestRate}
                    onChange={e => setInterestRate(e.target.value)}
                    min={0}
                    max={50}
                    step={0.5}
                    className="w-16 px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>% per</span>
                  <select
                    value={interestPeriod}
                    onChange={e => setInterestPeriod(e.target.value as 'weekly' | 'monthly')}
                    className="px-2 py-1 rounded text-sm"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="weekly">week</option>
                    <option value="monthly">month</option>
                  </select>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loanAmount <= 0 || createLoan.isPending}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            {createLoan.isPending ? 'Creating...' : 'Create Loan'}
          </button>
        </div>
      </div>
    </ModalV2>
  )
}

// ============================================================
// Screen 10: Purchase Deduction Modal
// ============================================================

export function PurchaseDeductionModal({
  isOpen,
  onClose,
  familyId,
  memberId,
  memberName,
}: {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  memberName: string
}) {
  const { data: balance } = useRunningBalance(memberId)
  const createDeduction = useCreateDeduction()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const currentBalance = balance ?? 0
  const deductAmount = Number(amount) || 0

  const handleConfirm = async () => {
    if (deductAmount <= 0 || !description.trim()) return
    await createDeduction.mutateAsync({
      family_id: familyId,
      family_member_id: memberId,
      amount: deductAmount,
      description: description.trim(),
    })
    onClose()
  }

  return (
    <ModalV2
      id="purchase-deduction-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Purchase Deduction"
      type="transient"
      size="sm"
    >
      <div className="space-y-4 p-4">
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Child: <span className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>{memberName}</span>
          <br />
          Current balance: <span className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>${currentBalance.toFixed(2)}</span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>Amount</label>
          <div className="flex items-center gap-1">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={0.01}
              max={currentBalance}
              step={0.01}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            />
          </div>
          {deductAmount > currentBalance && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>
              Cannot exceed balance. Create a loan for overdrafts.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-heading)' }}>What was purchased</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Minecraft expansion pack"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {deductAmount > 0 && deductAmount <= currentBalance && (
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            New balance after deduction: <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>
              ${(currentBalance - deductAmount).toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deductAmount <= 0 || deductAmount > currentBalance || !description.trim() || createDeduction.isPending}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            {createDeduction.isPending ? 'Processing...' : 'Confirm Deduction'}
          </button>
        </div>
      </div>
    </ModalV2>
  )
}
