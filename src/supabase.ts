import { createClient } from '@supabase/supabase-js';

// Config comes from the environment (Vite exposes VITE_* to the client).
// Copy .env.example to .env and fill these in. The anon key is a publishable
// client key; real access control is enforced by Supabase Row Level Security.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. See .env.example.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
