import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 
    'Missing Supabase environment variables.\n\n' +
    'Please create a .env file in the root directory with:\n' +
    'VITE_SUPABASE_URL=your_supabase_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_anon_key\n\n' +
    'Get these from: Supabase Dashboard → Settings → API';
  
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
  
  // In production, show a user-friendly error
  if (import.meta.env.PROD) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui;">
        <div style="max-width: 600px; text-align: center;">
          <h1 style="color: #dc2626; margin-bottom: 16px;">Configuration Error</h1>
          <p style="color: #6b7280; margin-bottom: 24px;">${errorMsg}</p>
          <p style="color: #9ca3af; font-size: 14px;">Please contact the administrator.</p>
        </div>
      </div>
    `;
  }
  
  throw new Error(errorMsg);
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
