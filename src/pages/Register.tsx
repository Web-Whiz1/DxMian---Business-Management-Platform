import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Register() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteToken: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<{ business_id: string; business_name: string } | null>(null);

  // Check for invite token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setFormData(prev => ({ ...prev, inviteToken: token }));
      validateInviteToken(token);
    }
  }, []);

  const validateInviteToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_invites')
        .select('*, business:businesses(id, name)')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        setError('Invalid or expired invite link');
        return;
      }

      setInviteData({
        business_id: data.business_id,
        business_name: (data.business as any)?.name || 'Business',
      });
    } catch (err) {
      setError('Failed to validate invite link');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      // If there's an invite token, validate it first
      if (formData.inviteToken) {
        const { data: invite, error: inviteError } = await supabase
          .from('staff_invites')
          .select('*, business:businesses(id, name)')
          .eq('token', formData.inviteToken)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (inviteError || !invite) {
          throw new Error('Invalid or expired invite link');
        }

        // Sign up as staff with business_id
        await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          'STAFF',
          invite.business_id
        );

        // Mark invite as used
        await supabase
          .from('staff_invites')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('token', formData.inviteToken);

        window.location.href = '/dashboard';
      } else {
        // Regular business owner signup
        await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          'BUSINESS_OWNER'
        );
        window.location.href = '/dashboard/setup';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      
      // Handle specific error types
      if (errorMessage.includes('Connection error') || errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-10 border border-gray-100">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Create Your Account</h1>
          <p className="text-gray-600 text-base">Start managing your business today</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2.5">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2.5">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="input-field"
              placeholder="you@example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="input-field"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="input-field"
              />
            </div>
          </div>

          {inviteData && (
            <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-blue-900">Staff Invitation</p>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                You're being invited to join <strong className="font-semibold">{inviteData.business_name}</strong> as a staff member.
              </p>
            </div>
          )}

          {!inviteData && (
            <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                <p className="font-semibold text-gray-900">Business Owner Account</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Create an account to manage your business. Staff members should use an invite link from their business owner.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-base shadow-md"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 font-medium hover:text-blue-700">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
