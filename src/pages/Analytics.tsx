import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyData {
  month: string;
  bookings: number;
  revenue: number;
}

export function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    averageBookingValue: 0,
    totalBookings: 0,
    totalCustomers: 0,
  });

  useEffect(() => {
    if (user?.business_id) {
      loadAnalytics();
    }
  }, [user?.business_id]);

  const loadAnalytics = async () => {
    if (!user?.business_id) return;

    try {
      const months: MonthlyData[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date).toISOString();
        const monthEnd = endOfMonth(date).toISOString();

        const { data: bookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('business_id', user.business_id)
          .gte('start_time', monthStart)
          .lte('start_time', monthEnd);

        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'PAID')
          .in('booking_id', bookings?.map(b => b.id) || []);

        const revenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        months.push({
          month: format(date, 'MMM'),
          bookings: bookings?.length || 0,
          revenue: Number(revenue.toFixed(2)),
        });
      }

      setMonthlyData(months);

      const { data: allBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('business_id', user.business_id);

      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'PAID')
        .in('booking_id', allBookings?.map(b => b.id) || []);

      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', user.business_id);

      const totalRev = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const avgBooking = allBookings?.length ? totalRev / allBookings.length : 0;

      setStats({
        totalRevenue: totalRev,
        averageBookingValue: avgBooking,
        totalBookings: allBookings?.length || 0,
        totalCustomers: customers?.length || 0,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="analytics">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your business performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Avg. Booking Value</p>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.averageBookingValue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Per booking</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Customers</p>
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            <p className="text-xs text-gray-500 mt-1">Registered</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Month</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
