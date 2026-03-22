'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';
import { useRouter } from 'next/navigation';

export default function MisFavoritos() {
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function cargarFavoritos() {
      // 1. Verificar si hay usuario
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. Cargar favoritos con una consulta plana y limpia
      const { data, error } = await supabase
        .from('favoritos')
        .select(`
          id,
          productos (
            id, 
            nombre, 
            precio, 
            imagen_url,
            vendedores (nombre_tienda)
          )
        `)
        .eq('id_usuario', user.id);

      if (error) {
        console.error("Error cargando favoritos:", error);
      } else if (data) {
        // Filtramos por si acaso algún producto guardado fue eliminado de la tienda
        const validos = data.filter((f: any) => f.productos !== null);
        setFavoritos(validos);
      }
      
      setCargando(false);
    }

    cargarFavoritos();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500">
      
      {/* NAVBAR */}
      <nav className="border-b border-gray-100 dark:border-zinc-900 p-6 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-black italic text-xl uppercase tracking-tighter hover:opacity-70 transition">
            VINTAGE<span className="text-blue-600">.</span>LAB
          </Link>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition">
              ← Volver
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <header className="mb-16">
          <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] block mb-4">Curated Selection</span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase leading-none">Mis Guardados ❤️</h1>
        </header>

        {cargando ? (
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-zinc-900 animate-pulse rounded-[2.5rem]"></div>
            ))}
          </div>
        ) : favoritos.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-[3rem] flex flex-col items-center">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic mb-8">Tu lista de deseos está vacía</p>
            <Link href="/" className="bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition shadow-2xl">
              Explorar Drops
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 md:gap-x-8 gap-y-12">
            {favoritos.map((fav) => (
              <Link href={`/producto/${fav.productos.id}`} key={fav.id} className="group block">
                <div className="relative aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[#f9f9f9] dark:bg-zinc-900 mb-4 border border-gray-50 dark:border-zinc-900 group-hover:shadow-2xl group-hover:shadow-red-500/10 transition-all">
                  <img 
                    src={fav.productos.imagen_url || '/placeholder.png'} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={fav.productos.nombre} 
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white/90 dark:bg-black/80 dark:text-white backdrop-blur-xl px-3 py-1.5 rounded-xl font-black text-[10px] shadow-xl">
                      {fav.productos.precio}€
                    </span>
                  </div>
                </div>
                <div className="px-2">
                  <p className="text-[8px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-1 truncate">
                    {fav.productos.vendedores?.nombre_tienda}
                  </p>
                  <h3 className="font-bold text-xs md:text-sm leading-tight uppercase italic tracking-tighter truncate group-hover:text-red-500 transition-colors">
                    {fav.productos.nombre}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="py-20 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em]">Vintage Lab Favorites Registry</p>
      </footer>
    </div>
  );
}