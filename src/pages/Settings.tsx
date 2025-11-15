import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, User, Building2, Clock, Bell, Save, AlertCircle } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  description: string | null;
  business_type: string;
}

interface BookingSettings {
  min_lead_time_hours: number;
  max_lead_time_days: number;
  cancellation_hours: number;
  buffer_time_minutes: number;
  deposit_percentage: number;
  require_payment: boolean;
  email_notifications?: boolean;
  booking_reminders?: boolean;
  payment_confirmations?: boolean;
}

export function Settings() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'booking' | 'notifications'>('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile form
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });

  // Business form
  const [businessData, setBusinessData] = useState<Business | null>(null);
  const [businessForm, setBusinessForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
  });

  // Booking settings
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    min_lead_time_hours: 2,
    max_lead_time_days: 90,
    cancellation_hours: 24,
    buffer_time_minutes: 0,
    deposit_percentage: 0,
    require_payment: false,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    booking_reminders: true,
    payment_confirmations: true,
  });

  const handleSaveNotifications = async () => {
    if (!user?.business_id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // First ensure booking_settings exists, then update notifications
      const { error: upsertError } = await supabase
        .from('booking_settings')
        .upsert({
          business_id: user.business_id,
          email_notifications: notifications.email_notifications,
          booking_reminders: notifications.booking_reminders,
          payment_confirmations: notifications.payment_confirmations,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'business_id'
        });

      if (upsertError) {
        // If upsert fails, try update
        const { error: updateError } = await supabase
          .from('booking_settings')
          .update({
            email_notifications: notifications.email_notifications,
            booking_reminders: notifications.booking_reminders,
            payment_confirmations: notifications.payment_confirmations,
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', user.business_id);
        
        if (updateError) throw updateError;
      }

      setSuccess('Notification preferences saved successfully');
      loadBookingSettings(); // Reload to sync state
    } catch (err: any) {
      setError(err.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name,
        last_name: user.last_name,
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.business_id) {
      loadBusinessData();
      loadBookingSettings();
    }
  }, [user?.business_id]);

  const loadBusinessData = async () => {
    if (!user?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', user.business_id)
        .single();

      if (error) throw error;
      if (data) {
        setBusinessData(data);
        setBusinessForm({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address || '',
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('Error loading business data:', error);
    }
  };

  const loadBookingSettings = async () => {
    if (!user?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('business_id', user.business_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setBookingSettings({
          min_lead_time_hours: data.min_lead_time_hours || 2,
          max_lead_time_days: data.max_lead_time_days || 90,
          cancellation_hours: data.cancellation_hours || 24,
          buffer_time_minutes: data.buffer_time_minutes || 0,
          deposit_percentage: data.deposit_percentage || 0,
          require_payment: data.require_payment || false,
          email_notifications: data.email_notifications ?? true,
          booking_reminders: data.booking_reminders ?? true,
          payment_confirmations: data.payment_confirmations ?? true,
        });
        setNotifications({
          email_notifications: data.email_notifications ?? true,
          booking_reminders: data.booking_reminders ?? true,
          payment_confirmations: data.payment_confirmations ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading booking settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      });
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!user?.business_id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: businessForm.name,
          email: businessForm.email,
          phone: businessForm.phone,
          address: businessForm.address || null,
          description: businessForm.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.business_id);

      if (error) throw error;
      setSuccess('Business information updated successfully');
      loadBusinessData();
    } catch (err: any) {
      setError(err.message || 'Failed to update business information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBookingSettings = async () => {
    if (!user?.business_id) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('booking_settings')
        .upsert({
          business_id: user.business_id,
          min_lead_time_hours: bookingSettings.min_lead_time_hours,
          max_lead_time_days: bookingSettings.max_lead_time_days,
          cancellation_hours: bookingSettings.cancellation_hours,
          buffer_time_minutes: bookingSettings.buffer_time_minutes,
          deposit_percentage: Math.max(0, Math.min(100, bookingSettings.deposit_percentage)),
          require_payment: bookingSettings.require_payment,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setSuccess('Booking settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save booking settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'business' as const, label: 'Business', icon: Building2 },
    { id: 'booking' as const, label: 'Booking', icon: Clock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <DashboardLayout active="settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and business preferences</p>
        </div>

        {(error || success) && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              error
                ? 'bg-red-50 border border-red-200'
                : 'bg-green-50 border border-green-200'
            }`}
          >
            {error ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setError('');
                      setSuccess('');
                    }}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, first_name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, last_name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        value={user?.role.replace('_', ' ')}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 capitalize"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Settings</h3>
                  {businessData ? (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          value={businessForm.name}
                          onChange={(e) =>
                            setBusinessForm({ ...businessForm, name: e.target.value })
                          }
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Email *
                          </label>
                          <input
                            type="email"
                            value={businessForm.email}
                            onChange={(e) =>
                              setBusinessForm({ ...businessForm, email: e.target.value })
                            }
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={businessForm.phone}
                            onChange={(e) =>
                              setBusinessForm({ ...businessForm, phone: e.target.value })
                            }
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={businessForm.address}
                          onChange={(e) =>
                            setBusinessForm({ ...businessForm, address: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={businessForm.description}
                          onChange={(e) =>
                            setBusinessForm({ ...businessForm, description: e.target.value })
                          }
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe your business..."
                        />
                      </div>
                      <button
                        onClick={handleSaveBusiness}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-600">No business information available.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Lead Time (hours)
                      </label>
                      <input
                        type="number"
                        value={bookingSettings.min_lead_time_hours}
                        onChange={(e) =>
                          setBookingSettings({
                            ...bookingSettings,
                            min_lead_time_hours: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Minimum time before a booking can be made
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Lead Time (days)
                      </label>
                      <input
                        type="number"
                        value={bookingSettings.max_lead_time_days}
                        onChange={(e) =>
                          setBookingSettings({
                            ...bookingSettings,
                            max_lead_time_days: parseInt(e.target.value) || 0,
                          })
                        }
                        min="1"
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        How far in advance customers can book
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Hours
                      </label>
                      <input
                        type="number"
                        value={bookingSettings.cancellation_hours}
                        onChange={(e) =>
                          setBookingSettings({
                            ...bookingSettings,
                            cancellation_hours: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Hours before booking when cancellation is allowed
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buffer Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={bookingSettings.buffer_time_minutes}
                        onChange={(e) =>
                          setBookingSettings({
                            ...bookingSettings,
                            buffer_time_minutes: parseInt(e.target.value) || 0,
                          })
                        }
                        min="0"
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Break time between appointments
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Percentage (0-100)
                      </label>
                      <input
                        type="number"
                        value={bookingSettings.deposit_percentage}
                        onChange={(e) =>
                          setBookingSettings({
                            ...bookingSettings,
                            deposit_percentage: Math.max(
                              0,
                              Math.min(100, parseInt(e.target.value) || 0)
                            ),
                          })
                        }
                        min="0"
                        max="100"
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Percentage of service price required as deposit
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="require_payment"
                        checked={bookingSettings.require_payment}
                        onChange={(e) =>
                          setBookingSettings({
                            ...bookingSettings,
                            require_payment: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="require_payment" className="text-sm text-gray-700 cursor-pointer">
                        Require payment at booking
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveBookingSettings}
                    disabled={saving}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive email alerts for new bookings</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.email_notifications}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            email_notifications: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Booking Reminders</p>
                        <p className="text-sm text-gray-500">
                          Send reminders to customers before appointments
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.booking_reminders}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            booking_reminders: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Payment Confirmations</p>
                        <p className="text-sm text-gray-500">Send receipts after successful payments</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.payment_confirmations}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            payment_confirmations: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    Note: Email notifications require email service configuration.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
