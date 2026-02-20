'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function MyChildrenPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/my-children').then((res) => setChildren(res.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Children</h1>
      <p className="text-gray-500 mb-6">View information about your children</p>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child: any) => (
            <div key={child.id} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{child.firstName} {child.lastName}</h3>
                  <p className="text-sm text-gray-500">{child.admissionNumber} - {child.class?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/dashboard/attendance?studentId=${child.id}`} className="btn-secondary text-xs justify-center">Attendance</Link>
                <Link href={`/dashboard/results`} className="btn-secondary text-xs justify-center">Results</Link>
                <Link href={`/dashboard/fees/statements`} className="btn-secondary text-xs justify-center">Fees</Link>
                <Link href={`/dashboard/announcements`} className="btn-secondary text-xs justify-center">Announcements</Link>
              </div>
            </div>
          ))}
          {children.length === 0 && (
            <div className="col-span-full card text-center py-8 text-gray-400">No children linked to your account</div>
          )}
        </div>
      )}
    </div>
  );
}
