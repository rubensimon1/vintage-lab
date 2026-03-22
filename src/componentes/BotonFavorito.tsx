'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/bibliotecas/supabase';

export default function BotonFavorito({ productoId, usuarioId }: { productoId: string, usuarioId: string | undefined }) {
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function comprobarEstado() {
      if (!usuarioId) { setCargando(false); return; }
      const { data } = await supabase
        .from('favoritos')
        .select('id')
        .eq('id_usuario', usuarioId)
        .eq('id_producto', productoId)
        .single();
      
      if (data) setEsFavorito(true);
      setCargando(false);
    }
    comprobarEstado();
  }, [productoId, usuarioId]);

  const toggleFavorito = async (e: React.MouseEvent) => {
    e.preventDefault(); // Evita que al hacer clic se abra el producto
    if (!usuarioId) return alert("Inicia sesión para guardar favoritos ❤️");

    if (esFavorito) {
      // Quitar de favoritos
      setEsFavorito(false);
      await supabase.from('favoritos').delete().eq('id_usuario', usuarioId).eq('id_producto', productoId);
    } else {
      // Añadir a favoritos
      setEsFavorito(true);
      await supabase.from('favoritos').insert([{ id_usuario: usuarioId, id_producto: productoId }]);
    }
  };

  if (cargando) return <div className="w-8 h-8 opacity-0"></div>;

  return (
    <button 
      onClick={toggleFavorito}
      className={`absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-lg border ${
        esFavorito 
        ? 'bg-red-500 border-red-400 text-white scale-110' 
        : 'bg-white/80 dark:bg-black/50 border-white/20 text-gray-400 hover:scale-110 hover:text-red-500'
      }`}
    >
      {esFavorito ? '❤️' : '🤍'}
    </button>
  );
}