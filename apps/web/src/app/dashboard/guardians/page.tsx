'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search } from 'lucide-react';

export default function GuardiansPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/students?limit=100${search ? `&search=${search}` : ''}`).then((res) => {
      setStudents(res.data || []);
    }).finally(() => setLoading(false));
  }, [search]);

  const guardians = new Map<string, { guardian: any; students: any[] }>();
  students.forEach((s) => {
    s.guardianLinks?.forEach((link: any) => {
      const g = link.guardian;
      if (!guardians.has(g.id)) guardians.set(g.id, { guardian: g, students: [] });
      guardians.get(g.id)!.students.push(s);
    });
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Guardians</h1>
      <p className="text-gray-500 mb-6">View guardian information linked to students</p>

      <div className="card mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="Search students to find guardians..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="space-y-3">
          {Array.from(guardians.values()).map(({ guardian, students }) => (
            <div key={guardian.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1">
                  <h3 className="font-medium">{guardian.firstName} {guardian.lastName}</h3>
                  <p className="text-sm text-gray-500">{guardian.phone} {guardian.email ? `| ${guardian.email}` : ''}</p>
                </div>
                <div className="text-sm text-gray-400">
                  Children: {students.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                </div>
              </div>
            </div>
          ))}
          {guardians.size === 0 && <div className="card text-center py-8 text-gray-400">No guardians found</div>}
        </div>
      )}
    </div>
  );
}
