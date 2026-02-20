'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, X, Megaphone } from 'lucide-react';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', target: 'SCHOOL', classId: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [annRes, classRes] = await Promise.all([
          api.get('/announcements'),
          api.get('/classes'),
        ]);
        setAnnouncements(annRes.data || []);
        setClasses(classRes.data || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/announcements', {
        ...form,
        classId: form.target === 'CLASS' ? form.classId : undefined,
      });
      setShowModal(false);
      window.location.reload();
    } catch (err: any) { alert(err.message); }
  };

  const canCreate = user && ['SCHOOL_ADMIN', 'HEAD_TEACHER', 'TEACHER'].includes(user.role);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500">School and class announcements</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" /> New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a: any) => (
            <div key={a.id} className="card">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex-shrink-0">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${a.target === 'SCHOOL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {a.target}{a.class ? `: ${a.class.name}` : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    By {a.author?.firstName} {a.author?.lastName} - {formatDate(a.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="card text-center py-8 text-gray-400">No announcements yet</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Announcement</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Content *</label>
                <textarea required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Target *</label>
                  <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="input">
                    <option value="SCHOOL">Whole School</option>
                    <option value="CLASS">Specific Class</option>
                  </select>
                </div>
                {form.target === 'CLASS' && (
                  <div>
                    <label className="label">Class *</label>
                    <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input">
                      <option value="">Select</option>
                      {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
