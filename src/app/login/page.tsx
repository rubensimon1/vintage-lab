'use client';

import { useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaginaLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (authError) throw authError;

      // --- LOGICA DE DECISIÓN ---
      // Comprobamos si ya tiene una tienda creada
      const { data: vendedor, error: vendedorError } = await supabase
        .from('vendedores')
        .select('id')
        .eq('id_usuario', user?.id)
        .single();

      if (vendedor) {
        // Si ya es vendedor, al panel de control
        router.push('/dashboard');
      } else {
        // Si no, a las preguntas
        router.push('/registro-vendedor');
      }
      
      router.refresh(); 

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f8f8] dark:bg-[#070707] p-4 transition-colors duration-500">
      <div className="bg-white dark:bg-[#0a0a0a] p-10 rounded-[3rem] shadow-2xl shadow-black/5 dark:shadow-white/5 w-full max-w-md border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
        {/* Adorno visual */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>

        <Link href="/" className="text-2xl font-black mb-2 text-center text-black dark:text-white block italic tracking-tighter uppercase mb-2 hover:opacity-70 transition">
          Vintage<span className="text-blue-600">.</span>Lab
        </Link>
        <p className="text-center text-gray-400 dark:text-gray-500 font-bold mb-8 text-[10px] uppercase tracking-widest">
          Estás entrando en la zona VIP
        </p>
        
        <form onSubmit={manejarLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1 tracking-widest">Email Requerido</label>
            <input 
              type="email" 
              placeholder="coleccionista@hype.com" 
              required
              className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-bold text-black dark:text-white placeholder:text-gray-300 dark:placeholder:text-zinc-600 transition-all shadow-sm"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1 tracking-widest">Llave de Acceso (Contraseña)</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-bold text-black dark:text-white placeholder:text-gray-300 dark:placeholder:text-zinc-600 transition-all shadow-sm"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 mt-4"
          >
            {cargando ? 'Desencriptando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            ¿No tienes acceso VIP?{' '}
            <Link href="/registro" className="text-black dark:text-white font-black hover:opacity-70 transition ml-1">
              Aplica Aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}