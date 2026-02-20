'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Download, Upload, X, Edit2 } from 'lucide-react';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '', gender: 'MALE',
    dateOfBirth: '', admissionNumber: '', admissionDate: new Date().toISOString().split('T')[0],
    classId: '', address: '', medicalNotes: '',
    guardians: [{ firstName: '', lastName: '', phone: '', email: '', relationship: 'Parent', isPrimary: true }],
  });

  const loadStudents = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);
      const res = await api.get(`/students?${params}`);
      setStudents(res.data);
      setTotalPages(res.totalPages || 1);
    } catch (err) { console.error(err); }
  };

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => {
    setLoading(true);
    loadStudents().finally(() => setLoading(false));
  }, [search, classFilter, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, form);
      } else {
        await api.post('/students', form);
      }
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      loadStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setForm({
      firstName: '', lastName: '', middleName: '', gender: 'MALE',
      dateOfBirth: '', admissionNumber: '', admissionDate: new Date().toISOString().split('T')[0],
      classId: classes[0]?.id || '', address: '', medicalNotes: '',
      guardians: [{ firstName: '', lastName: '', phone: '', email: '', relationship: 'Parent', isPrimary: true }],
    });
  };

  const openEdit = (student: any) => {
    setEditingStudent(student);
    setForm({
      firstName: student.firstName, lastName: student.lastName, middleName: student.middleName || '',
      gender: student.gender, dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
      admissionNumber: student.admissionNumber, admissionDate: student.admissionDate?.split('T')[0] || '',
      classId: student.classId, address: student.address || '', medicalNotes: student.medicalNotes || '',
      guardians: [],
    });
    setShowModal(true);
  };

  const canEdit = user && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HEAD_TEACHER'].includes(user.role);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500">Manage student records</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button onClick={() => api.download('/students/export' + (classFilter ? `?classId=${classFilter}` : ''), 'students.csv')} className="btn-secondary">
              <Download className="h-4 w-4 mr-2" /> Export
            </button>
            <button onClick={() => { resetForm(); setEditingStudent(null); setShowModal(true); }} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </button>
          </div>
        )}
      </div>

      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" placeholder="Search by name or admission number..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9"
            />
          </div>
          <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} className="input w-full sm:w-48">
            <option value="">All Classes</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adm #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Status</th>
                    {canEdit && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.admissionNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {s.firstName} {s.lastName}
                        <span className="block sm:hidden text-xs text-gray-400">{s.class?.name} - {s.gender}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{s.gender}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{s.class?.name}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {s.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit(s)} className="text-primary-600 hover:text-primary-800">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No students found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary">Previous</button>
              <span className="flex items-center px-3 text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary">Next</button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editingStudent ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Gender *</label>
                  <select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date of Birth *</label>
                  <input required type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Admission # *</label>
                  <input required value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Class *</label>
                  <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input">
                    <option value="">Select class</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" />
              </div>

              {!editingStudent && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-sm mb-3">Guardian Information</h3>
                  {form.guardians.map((g, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">First Name</label>
                          <input value={g.firstName} onChange={(e) => {
                            const gs = [...form.guardians]; gs[idx].firstName = e.target.value; setForm({ ...form, guardians: gs });
                          }} className="input" />
                        </div>
                        <div>
                          <label className="label">Last Name</label>
                          <input value={g.lastName} onChange={(e) => {
                            const gs = [...form.guardians]; gs[idx].lastName = e.target.value; setForm({ ...form, guardians: gs });
                          }} className="input" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Phone</label>
                          <input value={g.phone} onChange={(e) => {
                            const gs = [...form.guardians]; gs[idx].phone = e.target.value; setForm({ ...form, guardians: gs });
                          }} className="input" />
                        </div>
                        <div>
                          <label className="label">Relationship</label>
                          <input value={g.relationship} onChange={(e) => {
                            const gs = [...form.guardians]; gs[idx].relationship = e.target.value; setForm({ ...form, guardians: gs });
                          }} className="input" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingStudent ? 'Update' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
