'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Provider, AccountType } from '@/lib/types'

export function SettingsForm({ provider }: { provider: Provider }) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    full_name: provider.full_name,
    trade: provider.trade,
    phone: provider.phone ?? '',
    payout_method: provider.payout_method,
    bank_name: provider.bank_name ?? '',
    account_number: provider.account_number ?? '',
    account_type: provider.account_type ?? 'cheque',
    cashsend_phone: provider.cashsend_phone ?? '',
    cashsend_bank: provider.cashsend_bank ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (formData.payout_method === 'bank' && (!formData.bank_name || !formData.account_number)) {
      setError('Please fill in all bank account details')
      setLoading(false)
      return
    }

    if (formData.payout_method === 'cashsend' && (!formData.cashsend_phone || !formData.cashsend_bank)) {
      setError('Please fill in all CashSend details')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('providers')
      .update({
        full_name: formData.full_name,
        trade: formData.trade,
        phone: formData.phone || null,
        payout_method: formData.payout_method,
        bank_name: formData.payout_method === 'bank' ? formData.bank_name : null,
        account_number: formData.payout_method === 'bank' ? formData.account_number : null,
        account_type: formData.payout_method === 'bank' ? formData.account_type : null,
        cashsend_phone: formData.payout_method === 'cashsend' ? formData.cashsend_phone : null,
        cashsend_bank: formData.payout_method === 'cashsend' ? formData.cashsend_bank : null,
      })
      .eq('id', provider.id)

    if (updateError) {
      setError('Failed to update settings. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-medium text-gray-900">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="trade" className="block text-sm font-medium text-gray-700">
              Trade / Profession
            </label>
            <input
              type="text"
              id="trade"
              required
              value={formData.trade}
              onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
              placeholder="e.g. Plumber, Hairstylist, Painter"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0821234567"
              className={inputClass}
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700">Your Profile Link</p>
            <p className="mt-1 text-sm text-gray-900">
              <span className="text-gray-400">paylink.co.za/</span>
              {provider.slug}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">This can&apos;t be changed after signup</p>
          </div>
        </div>
      </div>

      {/* Payout Method */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-medium text-gray-900">Payout Method</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 hover:bg-gray-50">
              <input
                type="radio"
                name="payout_method"
                value="bank"
                checked={formData.payout_method === 'bank'}
                onChange={(e) =>
                  setFormData({ ...formData, payout_method: e.target.value as Provider['payout_method'] })
                }
                className="h-4 w-4 text-emerald-600"
              />
              <span className="text-sm font-medium text-gray-900">Bank account (EFT)</span>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 p-3 hover:bg-gray-50">
              <input
                type="radio"
                name="payout_method"
                value="cashsend"
                checked={formData.payout_method === 'cashsend'}
                onChange={(e) =>
                  setFormData({ ...formData, payout_method: e.target.value as Provider['payout_method'] })
                }
                className="h-4 w-4 text-emerald-600"
              />
              <span className="text-sm font-medium text-gray-900">CashSend (withdraw at ATM)</span>
            </label>
          </div>

          {formData.payout_method === 'bank' && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">
                  Bank Name
                </label>
                <select
                  id="bank_name"
                  required
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select your bank</option>
                  <option value="ABSA">ABSA</option>
                  <option value="Capitec">Capitec</option>
                  <option value="FNB">FNB</option>
                  <option value="Nedbank">Nedbank</option>
                  <option value="Standard Bank">Standard Bank</option>
                  <option value="TymeBank">TymeBank</option>
                  <option value="African Bank">African Bank</option>
                </select>
              </div>

              <div>
                <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  id="account_number"
                  required
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="account_type" className="block text-sm font-medium text-gray-700">
                  Account Type
                </label>
                <select
                  id="account_type"
                  required
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value as AccountType })}
                  className={inputClass}
                >
                  <option value="cheque">Cheque / Current</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>
          )}

          {formData.payout_method === 'cashsend' && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <label htmlFor="cashsend_phone" className="block text-sm font-medium text-gray-700">
                  CashSend Phone Number
                </label>
                <input
                  type="tel"
                  id="cashsend_phone"
                  required
                  value={formData.cashsend_phone}
                  onChange={(e) => setFormData({ ...formData, cashsend_phone: e.target.value })}
                  placeholder="0821234567"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-400">Customers will send CashSend to this number</p>
              </div>

              <div>
                <label htmlFor="cashsend_bank" className="block text-sm font-medium text-gray-700">
                  Your Bank
                </label>
                <select
                  id="cashsend_bank"
                  required
                  value={formData.cashsend_bank}
                  onChange={(e) => setFormData({ ...formData, cashsend_bank: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select your bank</option>
                  <option value="ABSA">ABSA</option>
                  <option value="FNB">FNB</option>
                  <option value="Nedbank">Nedbank</option>
                  <option value="Standard Bank">Standard Bank</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">Only these banks support CashSend</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">Settings updated successfully</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
