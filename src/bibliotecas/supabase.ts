import { createClient } from '@supabase/supabase-js';

// Estas variables las leerá de tu archivo .env.local automáticamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('⚠️ Error: Faltan las llaves de Supabase en el archivo .env.local');
}

// Este es el objeto "supabase" que usaremos para registrar usuarios y subir productos
export const supabase = createClient(supabaseUrl, supabaseAnonKey);