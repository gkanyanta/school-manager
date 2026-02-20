'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Plus, X } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [school, setSchool] = useState<any>(null);
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });
  const [termForm, setTermForm] = useState({ name: 'TERM_1', academicYearId: '', startDate: '', endDate: '', isCurrent: false });

  useEffect(() => {
    if (!user?.schoolId) return;
    const load = async () => {
      const [schoolRes, yearRes] = await Promise.all([
        api.get(`/schools/${user.schoolId}`),
        api.get('/academic-years'),
      ]);
      setSchool(schoolRes.data);
      setYears(yearRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">School Settings</h1>

      {school && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-3">School Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Name:</span> <span className="font-medium">{school.name}</span></div>
            <div><span className="text-gray-500">Code:</span> <span className="font-mono">{school.code}</span></div>
            <div><span className="text-gray-500">Email:</span> {school.email || '-'}</div>
            <div><span className="text-gray-500">Phone:</span> {school.phone || '-'}</div>
            <div className="col-span-2"><span className="text-gray-500">Address:</span> {school.address || '-'}</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Academic Years & Terms</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowTermModal(true)} className="btn-secondary text-sm">+ Term</button>
          <button onClick={() => setShowYearModal(true)} className="btn-primary text-sm">+ Academic Year</button>
        </div>
      </div>

      {years.map((y: any) => (
        <div key={y.id} className="card mb-3">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium">{y.name}</h3>
            {y.isCurrent && <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">Current</span>}
          </div>
          <div className="space-y-1">
            {y.terms?.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
                <span>{t.name?.replace('_', ' ')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">{new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}</span>
                  {t.isCurrent && <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">Current</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowYearModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">New Academic Year</h2>
            <form onSubmit={async (e) => { e.preventDefault(); await api.post('/academic-years', yearForm); setShowYearModal(false); window.location.reload(); }} className="space-y-4">
              <div><label className="label">Name *</label><input required value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} className="input" placeholder="e.g. 2026" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start *</label><input required type="date" value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} className="input" /></div>
                <div><label className="label">End *</label><input required type="date" value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} className="input" /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={yearForm.isCurrent} onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })} /> Set as current</label>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowYearModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
            </form>
          </div>
        </div>
      )}

      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowTermModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">New Term</h2>
            <form onSubmit={async (e) => { e.preventDefault(); await api.post('/terms', termForm); setShowTermModal(false); window.location.reload(); }} className="space-y-4">
              <div><label className="label">Term *</label><select value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })} className="input"><option value="TERM_1">Term 1</option><option value="TERM_2">Term 2</option><option value="TERM_3">Term 3</option></select></div>
              <div><label className="label">Academic Year *</label><select required value={termForm.academicYearId} onChange={(e) => setTermForm({ ...termForm, academicYearId: e.target.value })} className="input"><option value="">Select</option>{years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start *</label><input required type="date" value={termForm.startDate} onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })} className="input" /></div>
                <div><label className="label">End *</label><input required type="date" value={termForm.endDate} onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })} className="input" /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={termForm.isCurrent} onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })} /> Set as current</label>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowTermModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Create</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
