'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Users, GraduationCap, BookOpen, DollarSign, ClipboardCheck, FileText, Megaphone } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [feeDashboard, setFeeDashboard] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        if (['SCHOOL_ADMIN', 'HEAD_TEACHER'].includes(user.role)) {
          const [statsRes, feeRes, annRes] = await Promise.all([
            api.get(`/schools/${user.schoolId}/stats`),
            api.get('/fees/dashboard'),
            api.get('/announcements?limit=5'),
          ]);
          setStats(statsRes.data);
          setFeeDashboard(feeRes.data);
          setAnnouncements(annRes.data || []);
        } else if (user.role === 'BURSAR') {
          const feeRes = await api.get('/fees/dashboard');
          setFeeDashboard(feeRes.data);
        } else if (user.role === 'TEACHER') {
          const annRes = await api.get('/announcements?limit=5');
          setAnnouncements(annRes.data || []);
        } else if (user.role === 'PARENT') {
          const annRes = await api.get('/announcements?limit=5');
          setAnnouncements(annRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.firstName}</p>
      </div>

      {/* Admin / Head Teacher Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={GraduationCap} label="Students" value={stats.students} color="blue" />
          <StatCard icon={Users} label="Staff" value={stats.users} color="green" />
          <StatCard icon={BookOpen} label="Classes" value={stats.classes} color="purple" />
          <StatCard icon={BookOpen} label="Grades" value={stats.grades} color="orange" />
        </div>
      )}

      {/* Fee Dashboard */}
      {feeDashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={DollarSign} label="Total Billed" value={formatCurrency(feeDashboard.totalBilled)} color="blue" />
          <StatCard icon={DollarSign} label="Collected" value={formatCurrency(feeDashboard.totalCollected)} color="green" />
          <StatCard icon={DollarSign} label="Arrears" value={formatCurrency(feeDashboard.totalArrears)} color="red" />
          <StatCard icon={FileText} label="Collection Rate" value={`${feeDashboard.collectionRate}%`} color="purple" />
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary-600" />
            Recent Announcements
          </h2>
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className="border-b border-gray-100 pb-3 last:border-0">
                <h3 className="font-medium text-gray-900">{a.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{a.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  By {a.author?.firstName} {a.author?.lastName} - {a.target}
                  {a.class ? ` (${a.class.name})` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colorMap[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
