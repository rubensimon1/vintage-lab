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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-gray-200">
        <h1 className="text-2xl font-bold mb-2 text-center text-black">Marketplace Pro</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Entra para gestionar tu tienda</p>
        
        <form onSubmit={manejarLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Email</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50 mt-2"
          >
            {cargando ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-600 text-sm">
            ¿Aún no eres vendedor?{' '}
            <Link href="/registro" className="text-black font-bold hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}