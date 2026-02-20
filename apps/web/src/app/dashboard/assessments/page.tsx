'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Plus, X, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function AssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [form, setForm] = useState({
    name: '', type: 'TEST', subjectId: '', classId: '', termId: '', totalMarks: '100', weight: '25', date: '',
  });

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (classFilter) params.set('classId', classFilter);
      if (termFilter) params.set('termId', termFilter);
      const [assRes, classRes, subRes, yearRes] = await Promise.all([
        api.get(`/assessments?${params}`),
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/academic-years'),
      ]);
      setAssessments(assRes.data || []);
      setClasses(classRes.data || []);
      setSubjects(subRes.data || []);
      const allTerms = (yearRes.data || []).flatMap((y: any) => y.terms || []);
      setTerms(allTerms);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [classFilter, termFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assessments', {
        ...form,
        totalMarks: parseFloat(form.totalMarks),
        weight: parseFloat(form.weight),
        date: form.date || undefined,
      });
      setShowModal(false);
      load();
    } catch (err: any) { alert(err.message); }
  };

  const canEdit = user && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HEAD_TEACHER', 'TEACHER'].includes(user.role);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-500">Manage tests and exams</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" /> New Assessment
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input flex-1">
            <option value="">All Classes</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="input flex-1">
            <option value="">All Terms</option>
            {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a: any) => (
            <div key={a.id} className="card flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{a.name}</h3>
                <p className="text-sm text-gray-500">
                  {a.subject?.name} - {a.class?.name} - {a.type} - {a.totalMarks} marks ({a.weight}%)
                </p>
                <p className="text-xs text-gray-400">
                  By {a.teacher?.firstName} {a.teacher?.lastName} | {a._count?.markEntries || 0} marks entered
                </p>
              </div>
              {canEdit && (
                <Link href={`/dashboard/assessments/${a.id}/marks`} className="btn-secondary text-sm">
                  <Edit2 className="h-4 w-4 mr-1" /> Enter Marks
                </Link>
              )}
            </div>
          ))}
          {assessments.length === 0 && (
            <div className="card text-center py-8 text-gray-400">No assessments found</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Assessment</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Mid-Term Test" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type *</label>
                  <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                    <option value="TEST">Test</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="MIDTERM">Midterm</option>
                    <option value="ENDTERM">Endterm</option>
                  </select>
                </div>
                <div>
                  <label className="label">Class *</label>
                  <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input">
                    <option value="">Select</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Subject *</label>
                  <select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="input">
                    <option value="">Select</option>
                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.grade?.name})</option>)}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Total Marks *</label>
                  <input required type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Weight (%) *</label>
                  <input required type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="input" />
                </div>
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
