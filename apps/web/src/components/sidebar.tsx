'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  DollarSign,
  Megaphone,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  School,
  UserCircle,
} from 'lucide-react';

const roleNavItems: Record<string, { label: string; href: string; icon: any }[]> = {
  SCHOOL_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/dashboard/students', icon: GraduationCap },
    { label: 'Guardians', href: '/dashboard/guardians', icon: Users },
    { label: 'Classes', href: '/dashboard/classes', icon: BookOpen },
    { label: 'Subjects', href: '/dashboard/subjects', icon: BookOpen },
    { label: 'Teachers', href: '/dashboard/teachers', icon: UserCircle },
    { label: 'Timetable', href: '/dashboard/timetable', icon: Calendar },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
    { label: 'Assessments', href: '/dashboard/assessments', icon: FileText },
    { label: 'Report Cards', href: '/dashboard/report-cards', icon: FileText },
    { label: 'Fees', href: '/dashboard/fees', icon: DollarSign },
    { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Users', href: '/dashboard/users', icon: Users },
    { label: 'Audit Log', href: '/dashboard/audit', icon: Shield },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  HEAD_TEACHER: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/dashboard/students', icon: GraduationCap },
    { label: 'Classes', href: '/dashboard/classes', icon: BookOpen },
    { label: 'Assessments', href: '/dashboard/assessments', icon: FileText },
    { label: 'Report Cards', href: '/dashboard/report-cards', icon: FileText },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  ],
  BURSAR: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Fee Structures', href: '/dashboard/fees', icon: DollarSign },
    { label: 'Invoices', href: '/dashboard/fees/invoices', icon: FileText },
    { label: 'Payments', href: '/dashboard/fees/payments', icon: DollarSign },
    { label: 'Statements', href: '/dashboard/fees/statements', icon: FileText },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  ],
  TEACHER: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Classes', href: '/dashboard/my-classes', icon: BookOpen },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
    { label: 'Assessments', href: '/dashboard/assessments', icon: FileText },
    { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  ],
  PARENT: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Children', href: '/dashboard/my-children', icon: GraduationCap },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
    { label: 'Results', href: '/dashboard/results', icon: FileText },
    { label: 'Fee Statement', href: '/dashboard/fees/statements', icon: DollarSign },
    { label: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = roleNavItems[user.role] || roleNavItems.SCHOOL_ADMIN;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-600 text-white text-sm font-bold">
          SMS
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">School Manager</p>
          <p className="text-xs text-gray-500 truncate">{user.role.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 mt-1"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30">
        {sidebar}
      </aside>
    </>
  );
}
