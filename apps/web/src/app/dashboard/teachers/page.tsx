'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, X, Trash2 } from 'lucide-react';

export default function TeachersPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ teacherId: '', classId: '', subjectId: '', isClassTeacher: false });

  useEffect(() => {
    const load = async () => {
      try {
        const [assRes, userRes, classRes, subRes] = await Promise.all([
          api.get('/teacher-assignments'),
          api.get('/users?role=TEACHER'),
          api.get('/classes'),
          api.get('/subjects'),
        ]);
        setAssignments(assRes.data || []);
        setTeachers(userRes.data || []);
        setClasses(classRes.data || []);
        setSubjects(subRes.data || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/teacher-assignments', form);
      setShowModal(false);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this assignment?')) return;
    await api.delete(`/teacher-assignments/${id}`);
    window.location.reload();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Assignments</h1>
          <p className="text-gray-500">Assign teachers to classes and subjects</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="h-4 w-4 mr-2" /> New Assignment</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Class Teacher</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignments.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{a.teacher?.firstName} {a.teacher?.lastName}</td>
                  <td className="px-4 py-3 text-sm">{a.class?.name}</td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell">{a.subject?.name}</td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">{a.isClassTeacher ? 'Yes' : '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Assignment</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">Teacher *</label><select required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="input"><option value="">Select</option>{teachers.map((t: any) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}</select></div>
              <div><label className="label">Class *</label><select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input"><option value="">Select</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="label">Subject *</label><select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="input"><option value="">Select</option>{subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.grade?.name})</option>)}</select></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isClassTeacher} onChange={(e) => setForm({ ...form, isClassTeacher: e.target.checked })} /> Class Teacher</label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
