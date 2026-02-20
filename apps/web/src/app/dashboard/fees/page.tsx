'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, X, DollarSign, FileText, CreditCard, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function FeesPage() {
  const { user } = useAuth();
  const [structures, setStructures] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([{ name: 'Tuition Fee', amount: '0', isOptional: false }]);
  const [form, setForm] = useState({ gradeId: '', termId: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [strRes, gradeRes, yearRes, dashRes] = await Promise.all([
          api.get('/fees/structures'),
          api.get('/grades'),
          api.get('/academic-years'),
          api.get('/fees/dashboard'),
        ]);
        setStructures(strRes.data || []);
        setGrades(gradeRes.data || []);
        const allTerms = (yearRes.data || []).flatMap((y: any) => y.terms || []);
        setTerms(allTerms);
        setDashboard(dashRes.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fees/structures', {
        gradeId: form.gradeId,
        termId: form.termId,
        items: items.map((i) => ({ name: i.name, amount: parseFloat(i.amount), isOptional: i.isOptional })),
      });
      setShowModal(false);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  const canEdit = user && ['SCHOOL_ADMIN', 'BURSAR'].includes(user.role);

  if (loading) {
    return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Billing</h1>
          <p className="text-gray-500">Manage fee structures, invoices, and payments</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" /> New Fee Structure
          </button>
        )}
      </div>

      {/* Dashboard cards */}
      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Billed</p>
              <p className="font-bold">{formatCurrency(dashboard.totalBilled)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Collected</p>
              <p className="font-bold">{formatCurrency(dashboard.totalCollected)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Arrears</p>
              <p className="font-bold">{formatCurrency(dashboard.totalArrears)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Collection Rate</p>
              <p className="font-bold">{dashboard.collectionRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link href="/dashboard/fees/invoices" className="card hover:ring-primary-300 transition-all text-center py-4">
          <FileText className="h-8 w-8 mx-auto text-primary-600 mb-2" />
          <p className="font-medium">Invoices</p>
          <p className="text-sm text-gray-500">{dashboard?.invoiceCount || 0} total</p>
        </Link>
        <Link href="/dashboard/fees/payments" className="card hover:ring-primary-300 transition-all text-center py-4">
          <CreditCard className="h-8 w-8 mx-auto text-green-600 mb-2" />
          <p className="font-medium">Payments</p>
          <p className="text-sm text-gray-500">Record & receipts</p>
        </Link>
        <Link href="/dashboard/fees/statements" className="card hover:ring-primary-300 transition-all text-center py-4">
          <DollarSign className="h-8 w-8 mx-auto text-orange-600 mb-2" />
          <p className="font-medium">Statements</p>
          <p className="text-sm text-gray-500">Student fee history</p>
        </Link>
      </div>

      {/* Fee Structures */}
      <h2 className="text-lg font-semibold mb-3">Fee Structures</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {structures.map((s: any) => (
          <div key={s.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium">{s.grade?.name}</h3>
                <p className="text-sm text-gray-500">{s.term?.name.replace('_', ' ')}</p>
              </div>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(s.items?.reduce((sum: number, i: any) => sum + (i.isOptional ? 0 : i.amount), 0) || 0)}
              </span>
            </div>
            <div className="space-y-1">
              {s.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className={item.isOptional ? 'text-gray-400 italic' : 'text-gray-600'}>
                    {item.name} {item.isOptional ? '(optional)' : ''}
                  </span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Fee Structure</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Grade *</label>
                  <select required value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })} className="input">
                    <option value="">Select</option>
                    {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Term *</label>
                  <select required value={form.termId} onChange={(e) => setForm({ ...form, termId: e.target.value })} className="input">
                    <option value="">Select</option>
                    {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Fee Items</label>
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input placeholder="Name" value={item.name} onChange={(e) => { const n = [...items]; n[idx].name = e.target.value; setItems(n); }} className="input flex-1" />
                    <input type="number" placeholder="Amount" value={item.amount} onChange={(e) => { const n = [...items]; n[idx].amount = e.target.value; setItems(n); }} className="input w-28" />
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={item.isOptional} onChange={(e) => { const n = [...items]; n[idx].isOptional = e.target.checked; setItems(n); }} />
                      Opt
                    </label>
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setItems([...items, { name: '', amount: '0', isOptional: false }])} className="text-sm text-primary-600 hover:underline">
                  + Add item
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
