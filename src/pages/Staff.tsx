import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserCircle, Plus, Search, X, Edit, Trash2, Mail, Phone, Briefcase, Link2, Copy, Check } from 'lucide-react';

interface StaffMember {
  id: string;
  user_id: string;
  business_id: string;
  bio: string | null;
  photo: string | null;
  service_ids: string[] | null;
  is_active: boolean;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null;
  services: Array<{ id: string; name: string }> | null;
}

interface Service {
  id: string;
  name: string;
}

export function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    bio: '',
    service_ids: [] as string[],
    is_active: true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    if (user?.business_id) {
      loadStaff();
      loadServices();
      loadInvites();
    }
  }, [user?.business_id]);

  const loadStaff = async () => {
    if (!user?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          user:users(first_name, last_name, email, role)
        `)
        .eq('business_id', user.business_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load services for each staff member
      const staffWithServices = await Promise.all(
        (data || []).map(async (member) => {
          if (member.service_ids && member.service_ids.length > 0) {
            const { data: serviceData } = await supabase
              .from('services')
              .select('id, name')
              .in('id', member.service_ids)
              .eq('business_id', user.business_id);
            return { ...member, services: serviceData || [] };
          }
          return { ...member, services: [] };
        })
      );

      setStaff(staffWithServices);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    if (!user?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('business_id', user.business_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadInvites = async () => {
    if (!user?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('staff_invites')
        .select('*')
        .eq('business_id', user.business_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const generateInvite = async () => {
    if (!inviteEmail || !user?.business_id) return;

    setError('');
    setSubmitting(true);

    try {
      // Generate a unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const { data, error } = await supabase
        .from('staff_invites')
        .insert({
          business_id: user.business_id,
          email: inviteEmail,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Generate invite link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/register?token=${token}`;
      setInviteLink(link);
      setInviteEmail('');
      loadInvites();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invite');
    } finally {
      setSubmitting(false);
    }
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenModal = (staffMember?: StaffMember) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        email: staffMember.user?.email || '',
        first_name: staffMember.user?.first_name || '',
        last_name: staffMember.user?.last_name || '',
        bio: staffMember.bio || '',
        service_ids: staffMember.service_ids || [],
        is_active: staffMember.is_active ?? true,
      });
    } else {
      setEditingStaff(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        bio: '',
        service_ids: [],
        is_active: true,
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setError('');
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

    try {
      if (editingStaff) {
        // Update existing staff
        const { error: updateError } = await supabase
          .from('staff')
          .update({
            bio: formData.bio || null,
            service_ids: formData.service_ids.length > 0 ? formData.service_ids : null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStaff.id);

        if (updateError) throw updateError;

        // Update user info if changed
        if (editingStaff.user_id) {
          const { error: userError } = await supabase
            .from('users')
            .update({
              first_name: formData.first_name,
              last_name: formData.last_name,
            })
            .eq('id', editingStaff.user_id);

          if (userError) throw userError;
        }
      } else {
        // Create new staff - first create user account
        // Note: In production, you'd send an invitation email
        // For now, we'll assume the user already exists
        setError('To add staff, they must first register an account. Then you can assign them to your business.');
        setSubmitting(false);
        return;
      }

      handleCloseModal();
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to save staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    try {
      const { error } = await supabase.from('staff').delete().eq('id', staffId);
      if (error) throw error;
      loadStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    }
  };

  const toggleActiveStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !currentStatus })
        .eq('id', staffId);

      if (error) throw error;
      loadStaff();
    } catch (error) {
      console.error('Error updating staff status:', error);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    const name = `${member.user?.first_name} ${member.user?.last_name}`.toLowerCase();
    const email = member.user?.email.toLowerCase() || '';
    return name.includes(searchLower) || email.includes(searchLower);
  });

  if (loading) {
    return (
      <DashboardLayout active="staff">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="staff">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600 mt-1">Manage your team members and their schedules</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Link2 className="w-5 h-5" />
              Generate Invite Link
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Staff Member
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Add your first staff member to get started'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className={`border-2 rounded-lg p-6 transition-all ${
                    member.is_active
                      ? 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      : 'border-gray-100 bg-gray-50 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {member.user?.first_name} {member.user?.last_name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {member.user?.role?.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleActiveStatus(member.id, member.is_active)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        member.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.user?.email}</span>
                    </div>
                    {member.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2">{member.bio}</p>
                    )}
                  </div>

                  {member.services && member.services.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Briefcase className="w-3 h-3" />
                        Services
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {member.services.map((service) => (
                          <span
                            key={service.id}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                          >
                            {service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => handleOpenModal(member)}
                      className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invites Section */}
        {invites.filter(i => !i.used).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Invitations</h2>
            <div className="space-y-3">
              {invites.filter(i => !i.used && new Date(i.expires_at) > new Date()).map((invite) => {
                const link = `${window.location.origin}/register?token=${invite.token}`;
                return (
                  <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <p className="text-sm text-gray-500">
                        Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Generate Staff Invite</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteLink('');
                  setInviteEmail('');
                  setError('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {inviteLink ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-2">Invite link generated!</p>
                    <p className="text-xs text-green-700 mb-3">Share this link with the staff member:</p>
                    <div className="flex items-center gap-2 p-3 bg-white border border-green-200 rounded-lg">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 text-sm text-gray-900 bg-transparent border-none outline-none"
                      />
                      <button
                        onClick={copyInviteLink}
                        className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                        title="Copy link"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteLink('');
                      setInviteEmail('');
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    generateInvite();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      placeholder="staff@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The invite link will be valid for 7 days
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteModal(false);
                        setInviteEmail('');
                        setError('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !inviteEmail}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Generating...' : 'Generate Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    disabled={!!editingStaff}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    disabled={!!editingStaff}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingStaff}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
                {!editingStaff && (
                  <p className="text-xs text-gray-500 mt-1">
                    Staff member must have an account. They can register and then you can assign them.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description about this staff member..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Services
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-500">No services available. Create services first.</p>
                  ) : (
                    services.map((service) => (
                      <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.service_ids.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                service_ids: [...formData.service_ids, service.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                service_ids: formData.service_ids.filter((id) => id !== service.id),
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{service.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">
                  Active (staff member can receive bookings)
                </label>
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
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editingStaff ? 'Update' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
