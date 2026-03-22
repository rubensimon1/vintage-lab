'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const productoId = searchParams.get('producto');
  const receptorId = searchParams.get('vendedor');
  
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let canal: any;

    async function iniciarChat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      setUsuario(user);

      // 1. Cargar historial inicial
      const { data } = await supabase
        .from('mensajes')
        .select('*')
        .or(`and(id_emisor.eq.${user.id},id_receptor.eq.${receptorId}),and(id_emisor.eq.${receptorId},id_receptor.eq.${user.id})`)
        .order('creado_el', { ascending: true });

      if (data) setMensajes(data);
      setCargando(false);

      // 2. CONFIGURACIÓN DEL CANAL (Realtime)
      const nombreCanal = `chat_${[user.id, receptorId].sort().join('_')}`;
      
      canal = supabase
        .channel(nombreCanal)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'mensajes' 
          }, 
          (payload) => {
            const nuevoM = payload.new;
            
            setMensajes((prev) => {
              // Evitamos duplicados: si ya existe (por la actualización optimista), no lo añadimos
              const existe = prev.find(m => m.id === nuevoM.id || (m.tempId && m.contenido === nuevoM.contenido));
              if (existe) return prev;
              return [...prev, nuevoM];
            });
          }
        )
        .subscribe();
    }

    iniciarChat();

    return () => {
      if (canal) supabase.removeChannel(canal);
    };
  }, [receptorId, router]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // 🔥 FUNCIÓN ENVIAR OPTIMISTA
  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !usuario || !receptorId) return;

    const texto = nuevoMensaje.trim();
    setNuevoMensaje(''); // Limpiar input inmediatamente

    // 1. Crear mensaje "Fantasma" local
    const mensajeOptimista = {
      id: 'temp-' + Date.now(),
      tempId: true, // Marcador para saber que es local
      id_emisor: usuario.id,
      id_receptor: receptorId,
      id_producto: productoId,
      contenido: texto,
      creado_el: new Date().toISOString()
    };

    // 2. Actualizar la lista local YA
    setMensajes((prev) => [...prev, mensajeOptimista]);

    // 3. Enviar a Supabase por detrás
    const { error } = await supabase.from('mensajes').insert([{
      id_emisor: usuario.id,
      id_receptor: receptorId,
      id_producto: productoId,
      contenido: texto
    }]);

    if (error) {
      alert("Error al enviar el mensaje");
      // Opcional: Eliminar el mensaje optimista de la lista si falla
      setMensajes((prev) => prev.filter(m => m.id !== mensajeOptimista.id));
    }
  };

  if (cargando) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#0a0a0a]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Abriendo Canal Seguro...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white dark:bg-[#0a0a0a] shadow-2xl overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-zinc-900 flex items-center justify-between bg-white/50 dark:bg-black/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition">←</Link>
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Vintage Lab Connect</p>
            <h2 className="text-sm font-black uppercase italic tracking-tighter">Chat Directo</h2>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fcfcfc] dark:bg-[#0d0d0d] scrollbar-hide">
        {mensajes.length === 0 && (
          <div className="text-center py-20 opacity-30 italic text-[10px] uppercase tracking-widest">No hay mensajes anteriores</div>
        )}
        {mensajes.map((m) => {
          const soyYo = m.id_emisor === usuario?.id;
          return (
            <div key={m.id} className={`flex ${soyYo ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[75%] p-4 rounded-[1.8rem] text-sm font-bold shadow-sm ${
                soyYo 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-tl-none text-black dark:text-white'
              }`}>
                {m.contenido}
                <div className={`text-[7px] mt-2 opacity-50 font-black uppercase ${soyYo ? 'text-right' : 'text-left'}`}>
                  {new Date(m.creado_el).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={enviarMensaje} className="p-6 bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-zinc-900">
        <div className="flex gap-4 items-center max-w-3xl mx-auto">
          <input 
            type="text" 
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe tu mensaje o propuesta..."
            className="flex-1 bg-gray-50 dark:bg-zinc-900 border-none px-6 py-4 rounded-full text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all text-black dark:text-white"
          />
          <button 
            type="submit" 
            className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <div className="h-screen bg-[#f5f5f5] dark:bg-black flex flex-col">
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <ChatContent />
      </Suspense>
    </div>
  );
}