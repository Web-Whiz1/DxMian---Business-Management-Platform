import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface Stats {
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingBookings: number;
  completedBookings: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingBookings: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [user?.business_id]);

  const loadDashboardData = async () => {
    if (!user?.business_id) return;

    try {
      const monthStart = startOfMonth(new Date()).toISOString();
      const monthEnd = endOfMonth(new Date()).toISOString();

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, customer:customers(first_name, last_name), service:services(name, price)')
        .eq('business_id', user.business_id)
        .gte('start_time', monthStart)
        .lte('start_time', monthEnd);

      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', user.business_id);

      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'PAID')
        .in('booking_id', bookings?.map(b => b.id) || []);

      const confirmed = bookings?.filter(b => b.status === 'CONFIRMED').length || 0;
      const pending = bookings?.filter(b => b.status === 'PENDING').length || 0;
      const completed = bookings?.filter(b => b.status === 'COMPLETED').length || 0;
      const revenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalBookings: bookings?.length || 0,
        confirmedBookings: confirmed,
        totalRevenue: revenue,
        totalCustomers: customers?.length || 0,
        pendingBookings: pending,
        completedBookings: completed,
      });

      const { data: recent } = await supabase
        .from('bookings')
        .select('*, customer:customers(first_name, last_name), service:services(name)')
        .eq('business_id', user.business_id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBookings(recent || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'blue',
      subtext: 'This month',
    },
    {
      title: 'Confirmed',
      value: stats.confirmedBookings,
      icon: CheckCircle,
      color: 'green',
      subtext: `${stats.pendingBookings} pending`,
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'emerald',
      subtext: 'This month',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'purple',
      subtext: 'Total registered',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user?.business_id) {
    return (
      <DashboardLayout active="overview">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Business Setup Required</h3>
              <p className="text-yellow-700 mb-4">
                You need to set up your business profile before you can start using the dashboard.
              </p>
              <a
                href="/dashboard/setup"
                className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Set Up Business
              </a>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout active="overview">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="overview">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back, {user.first_name}! 👋</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const colorClasses: Record<string, { bg: string; icon: string; text: string }> = {
              blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600' },
              green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-600' },
              emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-600' },
              purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-600' },
            };
            const colors = colorClasses[stat.color] || colorClasses.blue;
            
            return (
              <div
                key={stat.title}
                className="card-hover p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-medium">{stat.subtext}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${colors.bg} shadow-sm`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Bookings</h2>
            {recentBookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-medium">No bookings yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first booking to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-1">
                        {booking.customer?.first_name} {booking.customer?.last_name}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">{booking.service?.name}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {format(new Date(booking.start_time), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/dashboard/bookings"
                className="block w-full px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-center font-semibold shadow-md"
              >
                Create Booking
              </a>
              <a
                href="/dashboard/customers"
                className="block w-full px-4 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 text-center font-semibold"
              >
                Add Customer
              </a>
              <a
                href="/dashboard/services"
                className="block w-full px-4 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 text-center font-semibold"
              >
                Manage Services
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
