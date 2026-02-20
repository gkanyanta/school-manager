'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Check, X as XIcon, Clock, Save } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, { status: string; reason: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<'mark' | 'history'>('mark');

  // Parent-specific state
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState(searchParams.get('studentId') || '');
  const [childAttendance, setChildAttendance] = useState<any>(null);

  const isParent = user?.role === 'PARENT';

  // Load children for parent view
  useEffect(() => {
    if (!isParent) return;
    api.get('/students/my-children').then((res) => {
      setChildren(res.data || []);
      const preselect = searchParams.get('studentId');
      if (preselect && (res.data || []).some((c: any) => c.id === preselect)) {
        setSelectedChild(preselect);
      }
    });
  }, [isParent, searchParams]);

  // Load attendance for selected child (parent view)
  useEffect(() => {
    if (!isParent || !selectedChild) return;
    setLoading(true);
    api.get(`/attendance/student/${selectedChild}`)
      .then((res) => setChildAttendance(res.data))
      .finally(() => setLoading(false));
  }, [isParent, selectedChild]);

  useEffect(() => {
    if (isParent) return;
    const loadClasses = async () => {
      try {
        if (user?.role === 'TEACHER') {
          const res = await api.get(`/teacher-assignments?teacherId=${user.id}`);
          const unique = new Map();
          (res.data || []).forEach((a: any) => unique.set(a.classId, a.class));
          setClasses(Array.from(unique.values()));
        } else {
          const res = await api.get('/classes');
          setClasses(res.data || []);
        }
      } catch (err) { console.error(err); }
    };
    loadClasses();
  }, [user, isParent]);

  useEffect(() => {
    if (!selectedClass) return;
    const loadStudents = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/classes/${selectedClass}`);
        const studentList = res.data?.students || [];
        setStudents(studentList);
        const defaultRecords: Record<string, { status: string; reason: string }> = {};
        studentList.forEach((s: any) => {
          defaultRecords[s.id] = { status: 'PRESENT', reason: '' };
        });
        setRecords(defaultRecords);

        // Load existing records for this date
        const attRes = await api.get(`/attendance/class/${selectedClass}?startDate=${date}&endDate=${date}`);
        const sessions = attRes.data || [];
        if (sessions.length > 0) {
          const session = sessions[0];
          session.records?.forEach((r: any) => {
            defaultRecords[r.studentId] = { status: r.status, reason: r.reason || '' };
          });
          setRecords({ ...defaultRecords });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadStudents();
  }, [selectedClass, date]);

  useEffect(() => {
    if (!selectedClass) return;
    api.get(`/attendance/class/${selectedClass}`).then((res) => {
      setHistory(res.data || []);
    });
  }, [selectedClass]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/attendance', {
        classId: selectedClass,
        date,
        records: Object.entries(records).map(([studentId, r]) => ({
          studentId,
          status: r.status,
          reason: r.reason || undefined,
        })),
      });
      alert('Attendance saved');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = (studentId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const summary = {
    present: Object.values(records).filter((r) => r.status === 'PRESENT').length,
    absent: Object.values(records).filter((r) => r.status === 'ABSENT').length,
    late: Object.values(records).filter((r) => r.status === 'LATE').length,
  };

  // Parent view
  if (isParent) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Attendance</h1>
        <p className="text-gray-500 mb-6">View your children&apos;s attendance records</p>

        <div className="card mb-6">
          <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)} className="input w-full sm:w-64">
            <option value="">Select Child</option>
            {children.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </div>

        {loading && <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}

        {childAttendance && !loading && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="card text-center">
                <p className="text-2xl font-bold text-gray-900">{childAttendance.summary?.total || 0}</p>
                <p className="text-xs text-gray-500">Total Days</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-green-600">{childAttendance.summary?.present || 0}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-red-600">{childAttendance.summary?.absent || 0}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-primary-600">{childAttendance.summary?.rate || 0}%</p>
                <p className="text-xs text-gray-500">Attendance Rate</p>
              </div>
            </div>

            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(childAttendance.records || []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(r.attendanceSession?.date)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                          r.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{r.attendanceSession?.class?.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{r.reason || '—'}</td>
                    </tr>
                  ))}
                  {(childAttendance.records || []).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No attendance records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Attendance</h1>
      <p className="text-gray-500 mb-6">Mark and view attendance records</p>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input flex-1">
            <option value="">Select class</option>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-full sm:w-44" />
          <div className="flex gap-2">
            <button onClick={() => setTab('mark')} className={tab === 'mark' ? 'btn-primary' : 'btn-secondary'}>Mark</button>
            <button onClick={() => setTab('history')} className={tab === 'history' ? 'btn-primary' : 'btn-secondary'}>History</button>
          </div>
        </div>
      </div>

      {selectedClass && tab === 'mark' && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">{summary.present}</p>
              <p className="text-xs text-gray-500">Present</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
              <p className="text-xs text-gray-500">Absent</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
              <p className="text-xs text-gray-500">Late</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
          ) : (
            <div className="space-y-2">
              {students.map((s: any) => {
                const record = records[s.id];
                return (
                  <div key={s.id} className="card flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400">{s.admissionNumber}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setStatus(s.id, 'PRESENT')}
                        className={`p-2 rounded-lg transition-colors ${record?.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:bg-green-50'}`}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setStatus(s.id, 'ABSENT')}
                        className={`p-2 rounded-lg transition-colors ${record?.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400 hover:bg-red-50'}`}
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setStatus(s.id, 'LATE')}
                        className={`p-2 rounded-lg transition-colors ${record?.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400 hover:bg-yellow-50'}`}
                      >
                        <Clock className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {students.length > 0 && (
                <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {selectedClass && tab === 'history' && (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Late</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((h: any) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDate(h.date)}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{h.records?.filter((r: any) => r.status === 'PRESENT').length}</td>
                  <td className="px-4 py-3 text-sm text-red-600">{h.records?.filter((r: any) => r.status === 'ABSENT').length}</td>
                  <td className="px-4 py-3 text-sm text-yellow-600 hidden sm:table-cell">{h.records?.filter((r: any) => r.status === 'LATE').length}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{h.teacher?.firstName} {h.teacher?.lastName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
