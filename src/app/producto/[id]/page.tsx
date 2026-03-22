'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function DetalleProducto() {
  const { id } = useParams();
  const [producto, setProducto] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function obtenerProducto() {
      // Traemos el producto, el nombre de la tienda y el ID de usuario del vendedor para el chat
      const { data, error } = await supabase
        .from('productos')
        .select('*, vendedores(id, nombre_tienda, id_usuario)')
        .eq('id', id)
        .single();

      if (error || !data) {
        router.push('/');
      } else {
        setProducto(data);
      }
      setCargando(false);
    }
    obtenerProducto();
  }, [id, router]);

  const añadirACesta = () => {
    const cestaExistente = JSON.parse(localStorage.getItem('cesta') || '[]');
    const yaEsta = cestaExistente.find((item: any) => item.id === producto.id);
    
    if (yaEsta) {
      alert("Este artículo ya está en tu cesta 🛒");
      return;
    }

    const nuevaCesta = [...cestaExistente, {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen_url,
      tienda: producto.vendedores?.nombre_tienda
    }];

    localStorage.setItem('cesta', JSON.stringify(nuevaCesta));
    alert(`¡${producto.nombre} añadido a la cesta!`);
  };

  // 🔥 FUNCIÓN: ABRIR EL CHAT REALTIME
  const abrirChat = () => {
    if (!producto.vendedores?.id_usuario) {
      alert("No se puede contactar con este vendedor.");
      return;
    }
    // Redirigimos a la página de chat pasando el ID del producto y del vendedor
    router.push(`/chat?producto=${producto.id}&vendedor=${producto.vendedores.id_usuario}`);
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500">
      
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-gray-100 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-50">
        <Link href="/" className="font-black italic text-xl uppercase tracking-tighter hover:opacity-70 transition">
          Vintage<span className="text-blue-600">.</span>Lab
        </Link>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition">
            ← Explorar
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* COLUMNA IZQUIERDA: IMAGEN */}
        <div className="relative group">
          <div className="sticky top-28 rounded-[3rem] overflow-hidden bg-[#f9f9f9] dark:bg-zinc-900 shadow-2xl border border-gray-100 dark:border-zinc-800">
            {producto.imagen_url ? (
              <img 
                src={producto.imagen_url} 
                alt={producto.nombre} 
                className="w-full h-full object-cover aspect-[4/5] transition-transform duration-700 hover:scale-105" 
              />
            ) : (
              <div className="aspect-[4/5] flex items-center justify-center text-gray-300 dark:text-zinc-800 font-black">SIN IMAGEN</div>
            )}
            
            {/* BADGE DE TALLA SOBRE IMAGEN */}
            <div className="absolute top-8 left-8 bg-black/80 backdrop-blur-xl text-white px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
              Talla: {producto.talla || 'Única'}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: INFO */}
        <div className="flex flex-col justify-center">
          <div className="mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] mb-6 border border-blue-100 dark:border-blue-800/30">
              Autenticado por Vintage Lab ✓
            </span>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-4 uppercase italic">
              {producto.nombre}
            </h1>
            <div className="flex items-end gap-4">
               <p className="text-5xl font-black tracking-tight text-blue-600">
                {producto.precio}€
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">IVA Incluido</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {/* TALLA DESTACADA */}
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 px-8 py-4 rounded-3xl">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Talla Seleccionada</p>
                <p className="text-2xl font-black italic">{producto.talla || 'Única'}</p>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Descripción del Drop</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400 font-medium">
                {producto.descripcion || "Este artículo ha superado nuestras pruebas de calidad. Se entrega con certificado de autenticidad digital."}
              </p>
            </div>
            
            {/* TARJETA DEL VENDEDOR */}
            {producto.vendedores?.id && (
              <Link 
                href={`/tienda/${producto.vendedores.id}`}
                className="flex items-center gap-4 p-5 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#0f0f0f] hover:border-blue-500 hover:shadow-2xl transition-all group cursor-pointer"
              >
                <div className="w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-black text-2xl italic uppercase shadow-inner flex-shrink-0">
                  {producto.vendedores.nombre_tienda.charAt(0)}
                </div>
                <div>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Stock disponible en</p>
                  <p className="text-lg font-black uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                    {producto.vendedores.nombre_tienda}
                  </p>
                </div>
                <div className="ml-auto pr-4 text-2xl font-black opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all">→</div>
              </Link>
            )}
          </div>

          {/* ACCIONES */}
          <div className="flex flex-col gap-4">
            <button 
              onClick={añadirACesta}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-7 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition active:scale-95 flex justify-center items-center gap-3"
            >
              <span>🛒</span> Añadir a la Cesta
            </button>
            
            {/* 🔥 BOTÓN DE CHAT REALTIME */}
            <button 
              onClick={abrirChat}
              className="w-full border-2 border-black dark:border-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition flex justify-center items-center gap-3"
            >
              <span>💬</span> Hablar con el vendedor
            </button>
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-gray-100 dark:border-zinc-900 pt-8 opacity-60">
            <div className="text-center flex-1 border-r border-gray-100 dark:border-zinc-900">
               <p className="text-[10px] font-black uppercase">Express</p>
               <p className="text-[8px] font-bold text-gray-400">Envío 24/48h</p>
            </div>
            <div className="text-center flex-1 border-r border-gray-100 dark:border-zinc-900">
               <p className="text-[10px] font-black uppercase">Seguro</p>
               <p className="text-[8px] font-bold text-gray-400">Protección Stripe</p>
            </div>
            <div className="text-center flex-1">
               <p className="text-[10px] font-black uppercase">Garantía</p>
               <p className="text-[8px] font-bold text-gray-400">Vintage Lab</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em]">Vintage Lab Standards — 2026 Archive</p>
      </footer>
    </div>
  );
}