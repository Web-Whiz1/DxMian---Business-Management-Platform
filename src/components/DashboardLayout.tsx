import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  active?: string;
}

export function DashboardLayout({ children, active }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Services', href: '/dashboard/services', icon: Briefcase },
    { name: 'Staff', href: '/dashboard/staff', icon: UserCircle },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">DxMian</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="lg:flex">
        <aside
          className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-40 shadow-sm ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">DxMian</h1>
              <p className="text-sm font-medium text-gray-800">
                {user?.first_name} {user?.last_name}
              </p>
              <div className="text-xs text-gray-600 mt-1 capitalize font-medium">
                {user?.role.toLowerCase().replace('_', ' ')}
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.name.toLowerCase() ||
                  (item.href === '/dashboard' && active === 'overview');

                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    {item.name}
                  </a>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:pt-0 pt-16">
          <div className="p-6 lg:p-10 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
