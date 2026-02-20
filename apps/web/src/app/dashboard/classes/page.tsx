'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Plus, X, Users } from 'lucide-react';

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'grade' | 'class'>('class');
  const [form, setForm] = useState({ name: '', gradeId: '', capacity: '40', level: '', description: '' });

  const load = async () => {
    try {
      const [classRes, gradeRes] = await Promise.all([
        api.get('/classes'),
        api.get('/grades'),
      ]);
      setClasses(classRes.data || []);
      setGrades(gradeRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'grade') {
        await api.post('/grades', { name: form.name, level: parseInt(form.level), description: form.description });
      } else {
        await api.post('/classes', { name: form.name, gradeId: form.gradeId, capacity: parseInt(form.capacity) });
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canEdit = user && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HEAD_TEACHER'].includes(user.role);

  if (loading) {
    return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes & Grades</h1>
          <p className="text-gray-500">Manage academic structure</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => { setModalType('grade'); setForm({ name: '', gradeId: '', capacity: '40', level: '', description: '' }); setShowModal(true); }} className="btn-secondary">
              <Plus className="h-4 w-4 mr-2" /> Add Grade
            </button>
            <button onClick={() => { setModalType('class'); setForm({ name: '', gradeId: grades[0]?.id || '', capacity: '40', level: '', description: '' }); setShowModal(true); }} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" /> Add Class
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {grades.map((grade: any) => {
          const gradeClasses = classes.filter((c: any) => c.gradeId === grade.id);
          return (
            <div key={grade.id} className="card">
              <h3 className="font-semibold text-gray-900 mb-3">{grade.name}</h3>
              {gradeClasses.length === 0 ? (
                <p className="text-sm text-gray-400">No classes yet</p>
              ) : (
                <div className="space-y-2">
                  {gradeClasses.map((cls: any) => (
                    <div key={cls.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span className="text-sm font-medium">{cls.name}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        {cls._count?.students || 0}{cls.capacity ? `/${cls.capacity}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{modalType === 'grade' ? 'Add Grade' : 'Add Class'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder={modalType === 'grade' ? 'e.g. Grade 1' : 'e.g. Grade 1A'} />
              </div>
              {modalType === 'grade' ? (
                <>
                  <div>
                    <label className="label">Level *</label>
                    <input required type="number" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="input" placeholder="e.g. 1" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Grade *</label>
                    <select required value={form.gradeId} onChange={(e) => setForm({ ...form, gradeId: e.target.value })} className="input">
                      <option value="">Select grade</option>
                      {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Capacity</label>
                    <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input" />
                  </div>
                </>
              )}
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
