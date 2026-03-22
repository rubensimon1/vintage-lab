import { createClient } from '@supabase/supabase-js';

// Leemos las variables o asignamos un string vacío si no existen (evita el crash)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Solo lanzamos el aviso en la consola del navegador si faltan, 
// pero dejamos que el cliente se cree para que Next.js pueda compilar.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Configuración de Supabase incompleta. Revisa tus variables de entorno.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);