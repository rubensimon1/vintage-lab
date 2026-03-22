'use client';

import { useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import { useRouter } from 'next/navigation';

export default function RegistroVendedor() {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [formulario, setFormulario] = useState({
    nombre_tienda: '',
    razon_registro: '',
    metas: ''
  });
  const router = useRouter();

  const enviarRegistro = async () => {
    setCargando(true);
    try {
      // 1. Obtener el ID del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Debes estar logueado");

      // 2. Insertar en la tabla 'vendedores' que creamos en Supabase
      const { error } = await supabase
        .from('vendedores')
        .insert([{
          id_usuario: user.id,
          nombre_tienda: formulario.nombre_tienda,
          razon_registro: formulario.razon_registro,
          metas: formulario.metas,
          comision_actual: 15.00 // Tu comisión inicial
        }]);

      if (error) throw error;

      alert("¡Perfil de vendedor creado con éxito!");
      router.push('/dashboard'); // Próxima parada: El panel de control
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-black">Configura tu tienda</h2>
          <p className="mt-2 text-gray-600">Paso {paso} de 2</p>
        </div>

        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
          {paso === 1 ? (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Nombre de tu futura tienda</label>
              <input 
                type="text"
                placeholder="Ej: Vintage Clothes"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none text-black"
                value={formulario.nombre_tienda}
                onChange={(e) => setFormulario({...formulario, nombre_tienda: e.target.value})}
              />
              <button 
                onClick={() => setPaso(2)}
                disabled={!formulario.nombre_tienda}
                className="w-full bg-black text-white p-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">¿Por qué quieres empezar con nosotros?</label>
                <textarea 
                  className="w-full p-3 border rounded-xl mt-1 text-black"
                  rows={3}
                  value={formulario.razon_registro}
                  onChange={(e) => setFormulario({...formulario, razon_registro: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">¿Cuáles son tus metas?</label>
                <textarea 
                  className="w-full p-3 border rounded-xl mt-1 text-black"
                  rows={3}
                  value={formulario.metas}
                  onChange={(e) => setFormulario({...formulario, metas: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPaso(1)} className="flex-1 text-gray-500 font-medium">Atrás</button>
                <button 
                  onClick={enviarRegistro}
                  disabled={cargando || !formulario.razon_registro || !formulario.metas}
                  className="flex-2 bg-blue-600 text-white p-3 rounded-xl font-bold px-6 hover:bg-blue-700 disabled:opacity-50"
                >
                  {cargando ? 'Guardando...' : 'Finalizar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}