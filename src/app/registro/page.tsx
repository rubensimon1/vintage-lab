'use client';

import { useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaginaRegistro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

 const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación mínima de seguridad en el cliente
    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email: email.trim().toLowerCase(), // Limpia espacios y fuerza minúsculas
        password,
        options: {
          data: { 
            full_name: nombre.trim() // Limpia espacios en el nombre
          } 
        }
      });

      if (error) throw error;

      alert('¡Registro exitoso! Ya puedes iniciar sesión.');
      router.push('/login');
    } catch (error: any) {
      // Manejo de errores específico
      if (error.message.includes("Email address is invalid")) {
        alert("El formato del correo no es válido. Prueba con algo como usuario@gmail.com");
      } else {
        alert("Error: " + error.message);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-bold text-center mb-2 text-black">Nueva Cuenta</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">Empieza a vender tus productos hoy mismo</p>
        
        <form onSubmit={manejarRegistro} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              placeholder="Juan Pérez"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1">Email</label>
            <input 
              type="email" 
              placeholder="tu@email.com"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase ml-1 mb-1">Contraseña</label>
            <input 
              type="password" 
              placeholder="Mínimo 6 caracteres"
              required
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 mt-4"
          >
            {cargando ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-gray-600 text-sm hover:underline">
            ¿Ya tienes cuenta? <span className="text-blue-600 font-bold">Inicia sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}