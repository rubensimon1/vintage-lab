'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function InboxVendedor() {
  const [chats, setChats] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarChats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscamos mensajes donde el usuario actual sea el RECEPTOR (el vendedor)
      const { data, error } = await supabase
        .from('mensajes')
        .select(`
          *,
          productos (nombre, imagen_url)
        `)
        .eq('id_receptor', user.id)
        .order('creado_el', { ascending: false });

      if (data) {
        // Filtramos para no repetir el mismo comprador muchas veces
        const unicos = data.filter((v, i, a) => a.findIndex(t => t.id_emisor === v.id_emisor) === i);
        setChats(unicos);
      }
      setCargando(false);
    }
    cargarChats();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white">
      <nav className="p-6 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center max-w-5xl mx-auto">
        <Link href="/dashboard" className="font-black uppercase text-xs tracking-widest">← Panel</Link>
        <ThemeToggle />
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-10">Mensajes 📥</h1>

        {cargando ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 dark:bg-zinc-900 rounded-3xl animate-pulse"></div>)}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 dark:border-zinc-900 rounded-[3rem]">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No tienes mensajes nuevos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <Link 
                key={chat.id} 
                href={`/chat?vendedor=${chat.id_emisor}&producto=${chat.id_producto}`}
                className="flex items-center gap-4 p-6 bg-gray-50 dark:bg-zinc-900/50 rounded-[2rem] border border-transparent hover:border-blue-600 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black italic">
                  {chat.id_emisor.substring(0, 2).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Nuevo Interés</p>
                    <p className="text-[8px] text-gray-400 font-bold">
                      {new Date(chat.creado_el).toLocaleDateString()}
                    </p>
                  </div>
                  <h3 className="font-bold truncate text-sm">Interesado en: {chat.productos?.nombre}</h3>
                  <p className="text-xs text-gray-500 truncate mt-1 italic">"{chat.contenido}"</p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xl">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}