import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ktkqktpndbnxywyflfkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0a3FrdHBuZGJueHl3eWZsZmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Nzk1MDAsImV4cCI6MjA3ODQ1NTUwMH0.5lr6TNw6vfjeqEHkLBi0XEqyIq2YzAQadstXoHkKh28';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
