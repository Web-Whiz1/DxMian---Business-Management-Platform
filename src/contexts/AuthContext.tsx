import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Database } from '../lib/database.types';
import { supabase } from '../lib/supabase';

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type UserInsert = Tables['users']['Insert'];
type UserRole = Database['public']['Enums']['user_role'];

export type { User };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: 'BUSINESS_OWNER' | 'STAFF') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) throw error;
          if (userData && mounted) setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && mounted) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: userData }) => {
            if (userData && mounted) setUser(userData);
          });
      } else if (mounted) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Step 1: Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Handle network errors
        if (authError.message.includes('fetch') || authError.message.includes('Network')) {
          throw new Error(
            'Connection error: Unable to reach Supabase. Please check your internet connection and try again.'
          );
        }
        // Handle invalid credentials
        if (authError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password');
        }
        // Handle other auth errors
        throw new Error(authError.message || 'Authentication failed');
      }

      if (!authData?.user?.id) {
        throw new Error('Authentication succeeded but no user ID was returned');
      }

      // Step 2: Get or create user profile
      // Use a service role query or ensure we have proper RLS policies
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile access error:', profileError);
        console.error('Error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          status: (profileError as any).status,
        });
        
        // Check for RLS policy errors (400 status usually means RLS blocking)
        if (profileError.code === 'PGRST116' || (profileError as any).status === 400) {
          throw new Error(
            'RLS Policy Error: Row Level Security is blocking access to your profile. ' +
            'This usually means:\n' +
            '1. The database migrations need to be applied\n' +
            '2. The RLS policies need to be updated\n' +
            '3. Your user profile may not exist yet\n\n' +
            `Error: ${profileError.message}`
          );
        }
        if (profileError.code === '42501') {
          throw new Error('Permission denied: You do not have permission to access this resource. Check RLS policies.');
        }
        if (profileError.code?.startsWith('42')) {
          throw new Error(`Database error (${profileError.code}): ${profileError.message || 'Please check your database configuration and RLS policies.'}`);
        }
        // Show the actual error message for debugging
        throw new Error(`Unable to access user profile: ${profileError.message} (Code: ${profileError.code || 'unknown'})`);
      }

      if (profile) {
        console.log('Profile found:', { ...profile, password_hash: '[REDACTED]' });
        
        // Check email verification - only require for business owners
        if (profile.role === 'BUSINESS_OWNER' && !profile.email_verified) {
          await supabase.auth.signOut();
          throw new Error('Please verify your email address before signing in. Check your inbox for the verification link.');
        }
        
        setUser(profile);
        return;
      }

      // Step 3: Create new profile
      const newUserData: UserInsert = {
        id: authData.user.id,
        email: authData.user.email!,
        first_name: authData.user.user_metadata?.first_name || '',
        last_name: authData.user.user_metadata?.last_name || '',
        role: (authData.user.user_metadata?.role as UserRole) || 'CUSTOMER',
        business_id: authData.user.user_metadata?.business_id || null,
        email_verified: Boolean(authData.user.email_confirmed_at),
        password_hash: 'MIGRATED_TO_AUTH',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reset_token: null,
        reset_token_expires: null
      };

      console.log('Creating new profile:', { ...newUserData, password_hash: '[REDACTED]' });
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (insertError) {
        console.error('Profile creation error:', insertError);
        // Check for specific database errors
        if (insertError.code === '23505') {
          throw new Error('A user with this email already exists');
        }
        if (insertError.code?.startsWith('42')) {
          throw new Error('Database error: Please try again later');
        }
        throw new Error(`Unable to create user profile: ${insertError.message}`);
      }

      if (!newProfile) {
        throw new Error('Failed to create user profile: No data returned');
      }

      console.log('Profile created successfully');
      setUser(newProfile);

    } catch (error) {
      console.error('Authentication or profile creation failed:', error);
      
      // Re-throw with better error messages
      if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          throw new Error(
            'Connection error: Unable to connect to the server. Please check:\n' +
            '1. Your internet connection\n' +
            '2. The Supabase service is running\n' +
            '3. Your firewall settings'
          );
        }
        throw error;
      }
      throw new Error('Unable to sign in. Please try again.');
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'BUSINESS_OWNER' | 'STAFF',
    businessId?: string
  ) => {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role
          }
        }
      });

      if (authError) {
        // Handle network errors
        if (authError.message.includes('fetch') || authError.message.includes('Network')) {
          throw new Error(
            'Connection error: Unable to reach Supabase. Please check your internet connection and try again.'
          );
        }
        // Handle user already exists
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw authError;
      }

      if (!authData.user?.id) {
        throw new Error('No user ID returned from auth signup');
      }

      // Wait a moment for the database trigger to create the profile
      // The trigger will auto-create the profile, but we'll try to create/update it manually as backup
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to get the profile (might be created by trigger)
      let profile = null;
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (existingProfile) {
        // Profile exists (created by trigger or already exists)
        profile = existingProfile;
      } else {
        // Try to create profile manually (if trigger didn't work)
        // Wait for session to be established
        let attempts = 0;
        let session = null;
        while (attempts < 5 && !session) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          session = currentSession;
          attempts++;
        }

        if (!session && !authData.user.email_confirmed_at) {
          // Email confirmation required - profile will be created after confirmation
          throw new Error('Please check your email to verify your account. Your profile will be created automatically after verification.');
        }

        if (session) {
      // Create user profile
      const userProfile: UserInsert = {
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        business_id: businessId || null,
        email_verified: Boolean(authData.user.email_confirmed_at),
        password_hash: 'MIGRATED_TO_AUTH',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reset_token: null,
        reset_token_expires: null
      };

          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert([userProfile])
            .select()
            .single();

          if (createError) {
            console.error('Profile creation error:', createError);
            
            // If it's a duplicate key error, try to fetch again
            if (createError.code === '23505') {
              const { data: fetchedProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();
              
              if (fetchedProfile) {
                profile = fetchedProfile;
              } else {
                await supabase.auth.signOut();
                throw new Error('Profile creation failed. Please try signing in.');
              }
            } else {
              await supabase.auth.signOut();
              throw new Error(`Failed to create user profile: ${createError.message}`);
            }
          } else {
            profile = newProfile;
          }
        } else {
          throw new Error('Session not established. Please try signing in after verifying your email.');
        }
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile');
      }

      setUser(profile);

      // Check email verification - only require for business owners
      if (role === 'BUSINESS_OWNER' && !authData.user.email_confirmed_at) {
        throw new Error('Please check your email to verify your account before continuing');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      
      // Re-throw with better error messages
      if (error instanceof Error) {
        // Check for network errors
        if (error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          throw new Error(
            'Connection error: Unable to connect to the server. Please check:\n' +
            '1. Your internet connection\n' +
            '2. The Supabase service is running\n' +
            '3. Your firewall settings'
          );
        }
        throw error;
      }
      throw new Error('Failed to create account. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to sign out');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (data) setUser(data);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}