'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { BookOpen, Users } from 'lucide-react';
import Link from 'next/link';

export default function MyClassesPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get(`/teacher-assignments?teacherId=${user.id}`).then((res) => {
      setAssignments(res.data || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const uniqueClasses = new Map();
  assignments.forEach((a) => {
    if (!uniqueClasses.has(a.classId)) {
      uniqueClasses.set(a.classId, { class: a.class, subjects: [] });
    }
    uniqueClasses.get(a.classId).subjects.push(a.subject);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Classes</h1>
      <p className="text-gray-500 mb-6">Classes and subjects assigned to you</p>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from(uniqueClasses.values()).map(({ class: cls, subjects }) => (
            <div key={cls.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{cls.name}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Subjects: {subjects.map((s: any) => s.name).join(', ')}
              </p>
              <div className="flex gap-2">
                <Link href={`/dashboard/attendance`} className="btn-secondary text-xs flex-1 justify-center">Attendance</Link>
                <Link href={`/dashboard/assessments`} className="btn-primary text-xs flex-1 justify-center">Marks</Link>
              </div>
            </div>
          ))}
          {uniqueClasses.size === 0 && (
            <div className="col-span-full card text-center py-8 text-gray-400">No classes assigned to you yet</div>
          )}
        </div>
      )}
    </div>
  );
}
