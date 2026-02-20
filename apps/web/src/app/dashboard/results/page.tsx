'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ResultsPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [childRes, yearRes] = await Promise.all([api.get('/students/my-children'), api.get('/academic-years')]);
      setChildren(childRes.data || []);
      setTerms((yearRes.data || []).flatMap((y: any) => y.terms || []));
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedChild || !selectedTerm) return;
    setLoading(true);
    api.get(`/assessments/results/student/${selectedChild}?termId=${selectedTerm}`)
      .then((res) => setResults(res.data))
      .finally(() => setLoading(false));
  }, [selectedChild, selectedTerm]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Results</h1>
      <p className="text-gray-500 mb-6">View your children's academic results</p>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} className="input flex-1">
            <option value="">Select Child</option>
            {children.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
          <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="input flex-1">
            <option value="">Select Term</option>
            {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name?.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}

      {results && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{results.student?.firstName} {results.student?.lastName}</h2>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary-600">{results.overall.average}%</span>
              <p className="text-sm">{results.overall.grade} - {results.overall.remarks}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2 pr-4">Subject</th><th className="text-right py-2 px-2">%</th><th className="text-center py-2 px-2">Grade</th><th className="text-left py-2 pl-2">Remarks</th></tr></thead>
              <tbody>
                {results.results?.map((r: any) => (
                  <tr key={r.subject.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{r.subject.name}</td>
                    <td className="py-2 px-2 text-right font-medium">{r.finalPercentage}</td>
                    <td className="py-2 px-2 text-center font-bold">{r.grade}</td>
                    <td className="py-2 pl-2 text-gray-500">{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
