'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ invoiceId: '', amount: '', method: 'CASH', reference: '', notes: '', paidDate: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    api.get('/fees/payments').then((res) => {
      setPayments(res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fees/payments', { ...form, amount: parseFloat(form.amount) });
      setShowModal(false);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" /> Record Payment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{p.receipt?.number || '-'}</td>
                    <td className="px-4 py-3 text-sm">{p.invoice?.student?.firstName} {p.invoice?.student?.lastName}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">{p.method?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell">{formatDate(p.paidDate)}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{p.receiver?.firstName} {p.receiver?.lastName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Invoice ID *</label>
                <input required value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })} className="input" placeholder="Paste invoice ID" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount *</label>
                  <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Method *</label>
                  <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="input">
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Reference</label>
                <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="input" placeholder="Transaction reference" />
              </div>
              <div>
                <label className="label">Date *</label>
                <input required type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })} className="input" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
