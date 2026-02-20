'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BarChart3, Users, ClipboardCheck, DollarSign, Download } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('enrollment');
  const [enrollment, setEnrollment] = useState<any>(null);
  const [feeReport, setFeeReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'enrollment') {
      api.get('/reports/enrollment').then((res) => setEnrollment(res.data)).finally(() => setLoading(false));
    } else if (activeTab === 'fees') {
      api.get('/reports/fee-collection').then((res) => setFeeReport(res.data)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  const tabs = [
    { id: 'enrollment', label: 'Enrollment', icon: Users },
    { id: 'fees', label: 'Fee Collection', icon: DollarSign },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reports</h1>
      <p className="text-gray-500 mb-6">School analytics and reports</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-600 hover:bg-gray-50 ring-1 ring-gray-200'}`}>
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {loading && <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>}

      {!loading && activeTab === 'enrollment' && enrollment && (
        <div>
          <div className="card mb-4">
            <p className="text-lg font-bold">Total Active Students: {enrollment.totalStudents}</p>
          </div>
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Classes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollment.grades?.map((g: any) => (
                  <tr key={g.grade}>
                    <td className="px-4 py-3 text-sm font-medium">{g.grade}</td>
                    <td className="px-4 py-3 text-sm text-right">{g.classes}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{g.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'fees' && feeReport && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-sm text-gray-500">Billed</p>
              <p className="text-lg font-bold">{formatCurrency(feeReport.totalBilled)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(feeReport.totalCollected)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Arrears</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(feeReport.totalArrears)}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500">Rate</p>
              <p className="text-lg font-bold">{feeReport.collectionRate}%</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Billed</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Arrears</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feeReport.gradeBreakdown?.map((g: any) => (
                  <tr key={g.grade}>
                    <td className="px-4 py-3 text-sm font-medium">{g.grade}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(g.totalBilled)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(g.totalCollected)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 hidden sm:table-cell">{formatCurrency(g.arrears)}</td>
                    <td className="px-4 py-3 text-sm text-right hidden md:table-cell">{g.collectionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => api.download('/reports/fee-collection/export', 'fee-report.csv')} className="btn-secondary mt-4">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
