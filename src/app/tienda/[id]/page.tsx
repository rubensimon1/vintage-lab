'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function PerfilTienda() {
  const { id } = useParams();
  const [tienda, setTienda] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);
  const [notaMedia, setNotaMedia] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarTienda() {
      if (!id) return;

      // 1. Cargar datos del vendedor
      const { data: datosVendedor } = await supabase
        .from('vendedores')
        .select('*')
        .eq('id', id)
        .single();

      if (datosVendedor) {
        setTienda(datosVendedor);

        // 2. Cargar sus productos ordenados por popularidad
        const { data: datosProductos } = await supabase
          .from('productos')
          .select('*')
          .eq('id_vendedor', id)
          .order('ventas_count', { ascending: false })
          .order('creado_el', { ascending: false });

        if (datosProductos) setProductos(datosProductos);

        // 3. 🔥 Cargar las Reseñas de este vendedor
        const { data: datosResenas } = await supabase
          .from('resenas')
          .select('*')
          .eq('id_vendedor', id)
          .order('creado_el', { ascending: false });

        if (datosResenas && datosResenas.length > 0) {
          setResenas(datosResenas);
          // Calculamos la nota media sumando todas las puntuaciones y dividiendo entre el total
          const suma = datosResenas.reduce((acc, curr) => acc + curr.puntuacion, 0);
          setNotaMedia(suma / datosResenas.length);
        }
      }
      setCargando(false);
    }

    cargarTienda();
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (!tienda) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] text-black dark:text-white">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">Tienda no encontrada</h1>
        <Link href="/" className="text-blue-600 font-bold uppercase tracking-widest text-xs hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  const inicial = tienda.nombre_tienda ? tienda.nombre_tienda.charAt(0).toUpperCase() : 'V';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="border-b border-gray-100 dark:border-zinc-900 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase italic flex-shrink-0 hover:opacity-70 transition">
            VINTAGE<span className="text-blue-600">.</span>LAB
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/" className="text-[10px] font-black bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full uppercase tracking-widest hover:scale-105 transition">
              Explorar Todo
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO / BANNER DE LA TIENDA */}
        <div className="relative h-[30vh] md:h-[40vh] bg-gradient-to-r from-blue-900 to-black overflow-hidden flex items-end">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-80 dark:opacity-100"></div>
        </div>

        {/* INFO DE LA TIENDA */}
        <div className="max-w-7xl mx-auto px-6 relative z-10 -mt-16 md:-mt-24 mb-16">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            
            <div className="w-32 h-32 md:w-48 md:h-48 bg-white dark:bg-[#111] rounded-full border-4 border-white dark:border-[#0a0a0a] shadow-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-6xl md:text-8xl font-black uppercase italic text-blue-600">{inicial}</span>
            </div>

            <div className="mb-2 md:mb-6">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                  Vendedor Verificado ✓
                </span>
                
                {/* 🔥 ESTRELLITAS EN LA CABECERA */}
                {resenas.length > 0 && (
                  <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-yellow-200 dark:border-yellow-900/50">
                    ⭐ {notaMedia.toFixed(1)} <span className="text-yellow-500/50">({resenas.length})</span>
                  </span>
                )}
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none drop-shadow-lg">
                {tienda.nombre_tienda}
              </h1>
              <p className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-[0.3em] mt-3">
                {productos.length} Drops Activos en el mercado
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          
          {/* GRID DE PRODUCTOS */}
          <div className="flex items-center justify-between mb-10 border-b border-gray-100 dark:border-zinc-900 pb-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Catálogo Disponible</h2>
          </div>

          {productos.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed border-gray-100 dark:border-zinc-900 rounded-[3rem]">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Este vendedor no tiene artículos a la venta</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16 mb-24">
              {productos.map((prod) => (
                <Link href={`/producto/${prod.id}`} key={prod.id} className="group block">
                  <div className="relative aspect-[4/5] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-[#f9f9f9] dark:bg-zinc-900 mb-4 md:mb-6 transition-all border border-gray-50 dark:border-zinc-900 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                    <img src={prod.imagen_url || '/placeholder.png'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={prod.nombre} />
                    <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5">
                      <span className="bg-white/90 dark:bg-black/80 dark:text-white backdrop-blur-xl px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs shadow-xl tracking-tighter">
                        {prod.precio}€
                      </span>
                    </div>
                  </div>
                  <div className="px-1 md:px-2">
                    <h3 className="font-bold text-[10px] md:text-sm leading-tight uppercase italic tracking-tighter truncate group-hover:text-blue-600 transition-colors">
                      {prod.nombre}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 🔥 SECCIÓN DE RESEÑAS */}
          {resenas.length > 0 && (
            <div className="border-t border-gray-100 dark:border-zinc-900 pt-16 pb-32">
              <div className="text-center mb-12">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">Feedback de la comunidad</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase">Valoraciones</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resenas.map((resena) => (
                  <div key={resena.id} className="bg-[#f9f9f9] dark:bg-[#111] p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all">
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-black text-sm italic uppercase">
                          {/* Inicial anónima del comprador */}
                          U
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Comprador Verificado</p>
                          <p className="text-[8px] font-bold text-gray-400 tracking-widest">
                            {new Date(resena.creado_el).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-black px-3 py-1.5 rounded-full shadow-sm text-xs">
                        {'⭐'.repeat(resena.puntuacion)}
                      </div>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      "{resena.comentario}"
                    </p>
                    
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}