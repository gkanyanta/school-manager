'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, X } from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export default function TimetablePage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ classId: '', subjectId: '', teacherId: '', dayOfWeek: 'MONDAY', periodNumber: '1', startTime: '08:00', endTime: '08:40' });

  useEffect(() => {
    const load = async () => {
      const [classRes, subRes, userRes] = await Promise.all([api.get('/classes'), api.get('/subjects'), api.get('/users?role=TEACHER')]);
      setClasses(classRes.data || []);
      setSubjects(subRes.data || []);
      setTeachers(userRes.data || []);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    api.get(`/timetable/${selectedClass}`).then((res) => setEntries(res.data || [])).finally(() => setLoading(false));
  }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/timetable', { ...form, classId: selectedClass, periodNumber: parseInt(form.periodNumber) });
      setShowModal(false);
      api.get(`/timetable/${selectedClass}`).then((res) => setEntries(res.data || []));
    } catch (err: any) { alert(err.message); }
  };

  const grouped = DAYS.map((day) => ({
    day,
    periods: entries.filter((e) => e.dayOfWeek === day).sort((a: any, b: any) => a.periodNumber - b.periodNumber),
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
        {selectedClass && <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="h-4 w-4 mr-2" /> Add Entry</button>}
      </div>

      <div className="card mb-4">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input">
          <option value="">Select class</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading && <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}

      {selectedClass && !loading && (
        <div className="space-y-4">
          {grouped.map(({ day, periods }) => (
            <div key={day} className="card">
              <h3 className="font-semibold text-gray-900 mb-2">{day}</h3>
              {periods.length === 0 ? <p className="text-sm text-gray-400">No periods</p> : (
                <div className="space-y-1">
                  {periods.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 text-sm">
                      <span className="font-mono text-xs text-gray-400 w-24">{p.startTime}-{p.endTime}</span>
                      <span className="font-medium flex-1">{p.subject?.name}</span>
                      <span className="text-gray-500 text-xs">P{p.periodNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Timetable Entry</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">Day *</label><select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="input">{DAYS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="label">Period #</label><input type="number" min="1" max="12" value={form.periodNumber} onChange={(e) => setForm({ ...form, periodNumber: e.target.value })} className="input" /></div>
                <div><label className="label">Start</label><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input" /></div>
                <div><label className="label">End</label><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input" /></div>
              </div>
              <div><label className="label">Subject *</label><select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="input"><option value="">Select</option>{subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="label">Teacher *</label><select required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="input"><option value="">Select</option>{teachers.map((t: any) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}</select></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
