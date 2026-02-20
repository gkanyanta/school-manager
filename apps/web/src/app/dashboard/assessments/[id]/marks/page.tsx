'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MarksEntryPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<any>(null);
  const [marks, setMarks] = useState<Record<string, { score: string; remarks: string }>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/assessments/${id}/marks`);
        setAssessment(res.data.assessment);
        const classRes = await api.get(`/classes/${res.data.assessment.classId}`);
        const studentList = classRes.data?.students || [];
        setStudents(studentList);

        const defaultMarks: Record<string, { score: string; remarks: string }> = {};
        studentList.forEach((s: any) => { defaultMarks[s.id] = { score: '', remarks: '' }; });

        (res.data.marks || []).forEach((m: any) => {
          defaultMarks[m.studentId] = { score: String(m.score), remarks: m.remarks || '' };
        });
        setMarks(defaultMarks);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(marks)
        .filter(([_, m]) => m.score !== '')
        .map(([studentId, m]) => ({
          studentId,
          score: parseFloat(m.score),
          remarks: m.remarks || undefined,
        }));

      await api.post(`/assessments/${id}/marks`, { marks: entries });
      alert('Marks saved successfully');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <Link href="/dashboard/assessments" className="flex items-center gap-1 text-sm text-primary-600 mb-4 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Assessments
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{assessment?.name}</h1>
        <p className="text-gray-500">
          {assessment?.subject?.name} - {assessment?.class?.name} - Total: {assessment?.totalMarks} marks
        </p>
      </div>

      <div className="space-y-2">
        {students.map((s: any) => (
          <div key={s.id} className="card flex flex-col sm:flex-row items-start sm:items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
              <p className="text-xs text-gray-400">{s.admissionNumber}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="number"
                min="0"
                max={assessment?.totalMarks}
                placeholder="Score"
                value={marks[s.id]?.score || ''}
                onChange={(e) => setMarks((prev) => ({ ...prev, [s.id]: { ...prev[s.id], score: e.target.value } }))}
                className="input w-24"
              />
              <input
                placeholder="Remarks"
                value={marks[s.id]?.remarks || ''}
                onChange={(e) => setMarks((prev) => ({ ...prev, [s.id]: { ...prev[s.id], remarks: e.target.value } }))}
                className="input flex-1"
              />
            </div>
          </div>
        ))}
      </div>

      {students.length > 0 && (
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-4">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Marks'}
        </button>
      )}
    </div>
  );
}
