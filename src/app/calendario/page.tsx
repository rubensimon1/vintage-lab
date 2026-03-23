'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function DropCalendar() {
  const [drops, setDrops] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDrops() {
      const hoy = new Date().toISOString();
      const { data } = await supabase
        .from('productos')
        .select(`
          *,
          vendedores(nombre_tienda)
        `)
        .not('fecha_lanzamiento', 'is', null)
        .gte('fecha_lanzamiento', hoy)
        .order('fecha_lanzamiento', { ascending: true });
        
      if (data) setDrops(data);
      setCargando(false);
    }
    cargarDrops();
  }, []);

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white transition-colors duration-500 font-sans">
      
      {/* NAVEGACIÓN */}
      <nav className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl mx-auto border-b border-gray-100 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-black italic text-xl uppercase tracking-tighter hover:opacity-70 transition">
            Vintage<span className="text-purple-600">.</span>Lab
          </Link>
          <span className="bg-purple-600 text-white px-3 py-1 rounded-[0.5rem] font-bold text-[8px] uppercase tracking-widest leading-none rotate-3">Drop Calendar</span>
        </div>
        
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest hover:text-purple-600 transition">
            ← Explorar
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="text-center py-20 px-6 max-w-4xl mx-auto">
         <div className="inline-block p-4 rounded-3xl bg-purple-50 dark:bg-purple-900/20 mb-6 border border-purple-100 dark:border-purple-800">
           <span className="text-4xl block mb-2">🗓️</span>
           <p className="text-[9px] font-black tracking-widest uppercase text-purple-600 dark:text-purple-400">Próximos Lanzamientos</p>
         </div>
         <h1 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter mb-6 leading-tight break-words">
            UPCOMING <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 block sm:inline">DROPS</span>
         </h1>
         <p className="text-gray-500 font-bold uppercase tracking-widest text-xs max-w-lg mx-auto leading-relaxed">
            Descubre los lanzamientos más exclusivos y los próximos Sorteos (Raffles) antes de que sucedan.
         </p>
      </section>

      {/* LISTA DE DROPS */}
      <main className="max-w-4xl mx-auto px-6 pb-32 space-y-8">
        {drops.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-[3rem]">
            <span className="text-6xl mb-6 block opacity-50 grayscale">⌛</span>
            <p className="font-black uppercase tracking-widest text-sm text-gray-400">No hay drops programados por ahora</p>
            <p className="text-[10px] text-gray-500 font-bold mt-2">Vuelve más tarde para ver las novedades.</p>
          </div>
        ) : (
          drops.map((drop) => {
            const date = new Date(drop.fecha_lanzamiento);
            const diaSemana = date.toLocaleDateString('es-ES', { weekday: 'short' });
            const diaNumero = date.getDate();
            const mes = date.toLocaleDateString('es-ES', { month: 'short' });
            const hora = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={drop.id} className="group relative flex flex-col md:flex-row items-center gap-8 bg-gray-50 dark:bg-zinc-900/50 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 transition-all hover:shadow-2xl hover:border-purple-200 dark:hover:border-purple-800">
                
                {/* CALENDARIO FECHA IZQUIERDA */}
                <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl min-w-[120px] group-hover:scale-110 transition-transform duration-500">
                  <p className="text-[10px] font-black uppercase text-purple-600">{mes}</p>
                  <p className="text-5xl font-black italic tracking-tighter leading-none my-1">{diaNumero}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{diaSemana}</p>
                </div>

                {/* IMAGEN DEL DROP */}
                <Link href={`/producto/${drop.id}`} className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex-shrink-0 relative cursor-pointer">
                  <img src={drop.imagen_url} alt={drop.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <p className="text-[8px] text-white font-black uppercase tracking-widest">🎟️ Sorteo</p>
                  </div>
                </Link>

                {/* INFO DEL DROP */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1.5">{drop.vendedores?.nombre_tienda}</p>
                  <Link href={`/producto/${drop.id}`}>
                    <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight hover:text-purple-500 transition-colors">{drop.nombre}</h2>
                  </Link>
                  <p className="text-gray-500 text-xs font-bold mt-2 uppercase tracking-widest">{drop.precio}€ • Talla: {drop.talla || 'Única'}</p>
                  
                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                    <Link 
                      href={`/producto/${drop.id}`}
                      className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                      <span className="text-sm">🗓️</span> Ver Detalles
                    </Link>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Se abre a las <span className="text-purple-500">{hora}</span>
                    </p>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </main>

    </div>
  );
}
