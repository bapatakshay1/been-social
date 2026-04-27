import { createClient } from '@supabase/supabase-js';

// The URL should not include /rest/v1/
const supabaseUrl = 'https://zpkxuczporzudiikajuo.supabase.co';
// Using the anon public key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwa3h1Y3pwb3J6dWRpaWthanVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTIyMjgsImV4cCI6MjA5Mjg4ODIyOH0.qEYH_LN4KOc0ViKcv6UFL0FIAzoFmg-4sfO5_W_EM6U';

export const supabase = createClient(supabaseUrl, supabaseKey);
