'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Plus, X } from 'lucide-react';

export default function SubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', gradeId: '', description: '' });

  const load = async () => {
    try {
      const params = gradeFilter ? `?gradeId=${gradeFilter}` : '';
      const [subRes, gradeRes] = await Promise.all([
        api.get(`/subjects${params}`),
        api.get('/grades'),
      ]);
      setSubjects(subRes.data || []);
      setGrades(gradeRes.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [gradeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subjects', form);
      setShowModal(false);
      load();
    } catch (err: any) { alert(err.message); }
  };

  const canEdit = user && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HEAD_TEACHER'].includes(user.role);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500">Manage subjects per grade</p>
        </div>
        {canEdit && (
          <button onClick={() => { setForm({ name: '', code: '', gradeId: grades[0]?.id || '', description: '' }); setShowModal(true); }} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" /> Add Subject
          </button>
        )}
      </div>

      <div className="card mb-4">
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="input w-full sm:w-48">
          <option value="">All Grades</option>
          {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{s.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{s.grade?.name}</td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No subjects found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Subject</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="label">Code *</label>
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input" placeholder="e.g. MATH" />
              </div>
              <div>
                <label className="label">Grade *</label>
                <select required value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })} className="input">
                  <option value="">Select grade</option>
                  {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
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
