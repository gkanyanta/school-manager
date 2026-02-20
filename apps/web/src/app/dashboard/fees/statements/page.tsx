'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Download } from 'lucide-react';

export default function StatementsPage() {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);

  const isParent = user?.role === 'PARENT';

  // Load children for parent
  useEffect(() => {
    if (!isParent) return;
    api.get('/students/my-children').then((res) => {
      const kids = res.data || [];
      setChildren(kids);
      if (kids.length === 1) loadStatement(kids[0].id);
    });
  }, [isParent]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await api.get(`/students?search=${searchQuery}&limit=10`);
      setSearchResults(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadStatement = async (id: string) => {
    setStudentId(id);
    setLoading(true);
    setSearchResults([]);
    try {
      const res = await api.get(`/fees/statements/student/${id}`);
      setStatement(res.data);
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Fee Statements</h1>
      <p className="text-gray-500 mb-6">View student fee history and balances</p>

      {isParent ? (
        <div className="card mb-6">
          <select
            value={studentId}
            onChange={(e) => e.target.value && loadStatement(e.target.value)}
            className="input w-full sm:w-64"
          >
            <option value="">Select Child</option>
            {children.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </div>
      ) : (
        <div className="card mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                placeholder="Search student by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary">
              <Search className="h-4 w-4" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 border rounded-lg divide-y">
              {searchResults.map((s: any) => (
                <button key={s.id} onClick={() => loadStatement(s.id)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                  {s.admissionNumber} - {s.firstName} {s.lastName} ({s.class?.name})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      )}

      {statement && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Fees</p>
              <p className="text-xl font-bold">{formatCurrency(statement.summary.totalFees)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(statement.summary.totalPaid)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Balance</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(statement.summary.balance)}</p>
            </div>
          </div>

          {statement.invoices?.map((inv: any) => (
            <div key={inv.id} className="card mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">{inv.number}</h3>
                  <p className="text-sm text-gray-500">{inv.term?.name?.replace('_', ' ')} - {inv.term?.academicYear?.name}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {inv.status?.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {inv.lines?.map((l: any) => (
                  <div key={l.id} className="flex justify-between text-sm">
                    <span>{l.name}</span>
                    <span>{formatCurrency(l.amount)}</span>
                  </div>
                ))}
              </div>
              {inv.payments?.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Payments</p>
                  {inv.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm text-green-600">
                      <span>{formatDate(p.paidDate)} - {p.method?.replace('_', ' ')} {p.receipt ? `(${p.receipt.number})` : ''}</span>
                      <span>-{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button onClick={() => api.download(`/fees/statements/student/${studentId}/export`, 'statement.csv')} className="btn-secondary">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
