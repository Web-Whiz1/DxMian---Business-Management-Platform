import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Plus, Search, Filter, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import type { BookingStatus } from '../lib/database.types';
import { Modal } from '../components/Modal';

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  customer_id: string;
  service_id: string;
  staff_id: string | null;
  customer: { first_name: string; last_name: string; email: string } | null;
  service: { name: string; price: number } | null;
  staff: { user_id: string } | null;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    staff_id: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: 'PENDING' as BookingStatus,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.business_id) {
      loadBookings();
      loadCustomers();
      loadServices();
    }
  }, [user?.business_id]);

  const loadBookings = async () => {
    if (!user?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:customers(first_name, last_name, email),
          service:services(name, price),
          staff(user_id)
        `)
        .eq('business_id', user.business_id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    if (!user?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .eq('business_id', user.business_id)
        .order('first_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadServices = async () => {
    if (!user?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration, price')
        .eq('business_id', user.business_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleOpenModal = (booking?: Booking) => {
    if (booking) {
      setEditingBooking(booking);
      const startDate = new Date(booking.start_time);
      const endDate = new Date(booking.end_time);
      setFormData({
        customer_id: booking.customer_id,
        service_id: booking.service_id,
        staff_id: booking.staff_id || '',
        start_time: format(startDate, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(endDate, "yyyy-MM-dd'T'HH:mm"),
        notes: booking.notes || '',
        status: booking.status,
      });
    } else {
      setEditingBooking(null);
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
      setFormData({
        customer_id: '',
        service_id: '',
        staff_id: '',
        start_time: format(now, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
        notes: '',
        status: 'PENDING',
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBooking(null);
    setError('');
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service && formData.start_time) {
      const start = new Date(formData.start_time);
      const end = new Date(start.getTime() + service.duration * 60 * 1000);
      setFormData({
        ...formData,
        service_id: serviceId,
        end_time: format(end, "yyyy-MM-dd'T'HH:mm"),
      });
    } else {
      setFormData({ ...formData, service_id: serviceId });
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    const service = services.find((s) => s.id === formData.service_id);
    if (service) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + service.duration * 60 * 1000);
      setFormData({
        ...formData,
        start_time: startTime,
        end_time: format(end, "yyyy-MM-dd'T'HH:mm"),
      });
    } else {
      setFormData({ ...formData, start_time: startTime });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!user?.business_id) {
      setError('Business ID is missing');
      setSubmitting(false);
      return;
    }

    if (!formData.customer_id || !formData.service_id || !formData.start_time || !formData.end_time) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    try {
      const bookingData = {
        business_id: user.business_id,
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        staff_id: formData.staff_id || null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        notes: formData.notes || null,
        status: formData.status,
      };

      if (editingBooking) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', editingBooking.id);

        if (updateError) throw updateError;
      } else {
        const { data: newBooking, error: insertError } = await supabase
          .from('bookings')
          .insert(bookingData)
          .select('id')
          .single();

        if (insertError) throw insertError;

        // Update customer's last_visit
        await supabase
          .from('customers')
          .update({ last_visit: bookingData.start_time })
          .eq('id', formData.customer_id);

        // Create payment record if service has price
        const service = services.find((s) => s.id === formData.service_id);
        if (service && service.price > 0 && newBooking) {
          await supabase.from('payments').insert({
            booking_id: newBooking.id,
            amount: service.price,
            status: 'PENDING',
          });
        }
      }

      handleCloseModal();
      loadBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to save booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      loadBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || booking.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout active="bookings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="bookings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-600 mt-1">Manage your appointments and reservations</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Booking
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as BookingStatus | 'ALL')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Create your first booking to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.customer?.first_name} {booking.customer?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{booking.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.service?.name}</div>
                        <div className="text-sm text-gray-500">${booking.service?.price}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(booking.start_time), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(booking.start_time), 'h:mm a')} -{' '}
                          {format(new Date(booking.end_time), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(booking)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <select
                            value={booking.status}
                            onChange={(e) =>
                              updateBookingStatus(booking.id, e.target.value as BookingStatus)
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="NO_SHOW">No Show</option>
                          </select>
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingBooking ? 'Edit Booking' : 'New Booking'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name} ({customer.email})
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No customers available. Please add customers first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
            <select
              value={formData.service_id}
              onChange={(e) => handleServiceChange(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price} ({service.duration} min)
                </option>
              ))}
            </select>
            {services.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No services available. Please add services first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this booking..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || customers.length === 0 || services.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : editingBooking ? 'Update Booking' : 'Create Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
