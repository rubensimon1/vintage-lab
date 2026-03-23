'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('id_usuario', user.id)
        .order('creado_el', { ascending: false });

      if (data) setNotificaciones(data);
      setCargando(false);

      // Marcar todas como leídas
      await supabase
        .from('notificaciones')
        .update({ leido: true })
        .eq('id_usuario', user.id)
        .eq('leido', false);
    }
    cargar();
  }, [router]);

  const iconoPorTipo: Record<string, string> = {
    oferta: '🤝',
    seguidor: '👤',
    compra: '🛍️',
    resena: '⭐',
    mensaje: '💬',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500">
      <nav className="border-b border-gray-100 dark:border-zinc-900 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="font-black italic text-xl uppercase tracking-tighter hover:opacity-70 transition">
            Vintage<span className="text-blue-600">.</span>Lab
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition">← Panel</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Centro de</p>
          <h1 className="text-5xl font-black tracking-tighter italic uppercase">Notificaciones</h1>
        </div>

        {cargando ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-zinc-900 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-gray-100 dark:border-zinc-900 rounded-[3rem]">
            <span className="text-6xl opacity-10 block mb-4">🔔</span>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notificaciones.map((n) => (
              <div 
                key={n.id} 
                className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg cursor-pointer ${
                  n.leido 
                    ? 'bg-white dark:bg-zinc-900/50 border-gray-100 dark:border-zinc-800' 
                    : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30'
                }`}
                onClick={() => n.enlace && router.push(n.enlace)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {iconoPorTipo[n.tipo] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-black text-sm uppercase tracking-tight">{n.titulo}</h3>
                      <span className="text-[8px] font-bold text-gray-400 flex-shrink-0">
                        {new Date(n.creado_el).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{n.mensaje}</p>
                    {!n.leido && (
                      <span className="inline-block mt-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
