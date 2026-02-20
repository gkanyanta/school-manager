'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({ classId: '', termId: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, classRes, yearRes] = await Promise.all([
          api.get(`/fees/invoices?page=${page}&limit=20`),
          api.get('/classes'),
          api.get('/academic-years'),
        ]);
        setInvoices(invRes.data || []);
        setTotalPages(invRes.totalPages || 1);
        setClasses(classRes.data || []);
        setTerms((yearRes.data || []).flatMap((y: any) => y.terms || []));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, [page]);

  const handleGenerate = async () => {
    try {
      const res = await api.post('/fees/invoices/generate-bulk', genForm);
      alert(`Generated: ${res.data.generated}, Skipped: ${res.data.skipped}`);
      setShowGenerate(false);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  const statusColor: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700',
    SENT: 'bg-blue-100 text-blue-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    DRAFT: 'bg-gray-100 text-gray-500',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button onClick={() => setShowGenerate(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" /> Generate Invoices
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Term</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{inv.number}</td>
                    <td className="px-4 py-3 text-sm">{inv.student?.firstName} {inv.student?.lastName}</td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">{inv.term?.name?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right hidden md:table-cell">{formatCurrency(inv.paidAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[inv.status] || ''}`}>
                        {inv.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary">Previous</button>
          <span className="flex items-center px-3 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary">Next</button>
        </div>
      )}

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowGenerate(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Generate Invoices</h2>
            <p className="text-sm text-gray-500 mb-4">Generate invoices for all students in a class based on the fee structure.</p>
            <div className="space-y-3">
              <div>
                <label className="label">Class *</label>
                <select value={genForm.classId} onChange={(e) => setGenForm({ ...genForm, classId: e.target.value })} className="input">
                  <option value="">Select</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Term *</label>
                <select value={genForm.termId} onChange={(e) => setGenForm({ ...genForm, termId: e.target.value })} className="input">
                  <option value="">Select</option>
                  {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name?.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGenerate(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleGenerate} disabled={!genForm.classId || !genForm.termId} className="btn-primary">Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
