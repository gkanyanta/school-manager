'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Download, FileText } from 'lucide-react';

export default function ReportCardsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [classRes, yearRes] = await Promise.all([api.get('/classes'), api.get('/academic-years')]);
      setClasses(classRes.data || []);
      setTerms((yearRes.data || []).flatMap((y: any) => y.terms || []));
    };
    load();
  }, []);

  const loadResults = async () => {
    if (!selectedClass || !selectedTerm) return;
    setLoading(true);
    try {
      const res = await api.get(`/assessments/results/class/${selectedClass}?termId=${selectedTerm}`);
      setResults(res.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadResults(); }, [selectedClass, selectedTerm]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Report Cards</h1>
      <p className="text-gray-500 mb-6">View and generate student report cards</p>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input flex-1">
            <option value="">Select Class</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="input flex-1">
            <option value="">Select Term</option>
            {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name?.replace('_', ' ')}</option>)}
          </select>
          {selectedClass && selectedTerm && (
            <button onClick={() => api.download(`/assessments/results/class/${selectedClass}/export?termId=${selectedTerm}`, 'results.csv')} className="btn-secondary">
              <Download className="h-4 w-4 mr-2" /> Export
            </button>
          )}
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r: any) => (
            <div key={r.student.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{r.student.firstName} {r.student.lastName}</h3>
                  <p className="text-sm text-gray-500">{r.student.admissionNumber} - {r.student.class?.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary-600">{r.overall.average}%</span>
                  <p className="text-sm font-medium">{r.overall.grade} - {r.overall.remarks}</p>
                </div>
              </div>
              {r.results.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1 pr-4">Subject</th>
                        <th className="text-right py-1 px-2">%</th>
                        <th className="text-center py-1 px-2">Grade</th>
                        <th className="text-left py-1 pl-2 hidden sm:table-cell">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.results.map((subj: any) => (
                        <tr key={subj.subject.id} className="border-b border-gray-100">
                          <td className="py-1 pr-4">{subj.subject.name}</td>
                          <td className="py-1 px-2 text-right font-medium">{subj.finalPercentage}</td>
                          <td className="py-1 px-2 text-center font-bold">{subj.grade}</td>
                          <td className="py-1 pl-2 text-gray-500 hidden sm:table-cell">{subj.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && selectedClass && selectedTerm && (
        <div className="card text-center py-8 text-gray-400">No results found for this class/term</div>
      )}
    </div>
  );
}
