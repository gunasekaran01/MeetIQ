import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
export const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'gunavera2020@gmail.com';
