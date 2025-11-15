// Utility to test Supabase connection
import { supabase } from './supabase';

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  try {
    // Test 1: Check if we can reach the Supabase API
    const { data, error } = await supabase.from('businesses').select('count').limit(1);
    
    if (error) {
      // Check for specific error codes
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'RLS Policy Error: Row Level Security is blocking access. Check your RLS policies.',
          details: error,
        };
      }
      
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        return {
          success: false,
          error: 'Network Error: Cannot connect to Supabase. Check your internet connection and Supabase URL.',
          details: error,
        };
      }
      
      return {
        success: false,
        error: `Database Error: ${error.message}`,
        details: error,
      };
    }
    
    return {
      success: true,
      details: 'Connection successful',
    };
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network Error: Failed to fetch. This usually means:\n1. Supabase URL is incorrect\n2. CORS is not configured\n3. Network connectivity issue',
        details: error.message,
      };
    }
    
    return {
      success: false,
      error: `Unexpected Error: ${error.message}`,
      details: error,
    };
  }
}

