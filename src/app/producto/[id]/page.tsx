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
  const [imagenActiva, setImagenActiva] = useState(0);
  const [mostrarOferta, setMostrarOferta] = useState(false);
  const [precioOferta, setPrecioOferta] = useState('');
  const [enviandoOferta, setEnviandoOferta] = useState(false);
  const [historialPrecios, setHistorialPrecios] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function obtenerProducto() {
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

      // Historial de precios
      const { data: historial } = await supabase
        .from('historial_precios')
        .select('*')
        .eq('id_producto', id)
        .order('fecha', { ascending: true });
      
      if (historial) setHistorialPrecios(historial);

      setCargando(false);
    }
    obtenerProducto();
  }, [id, router]);

  const todasLasImagenes = producto ? [
    producto.imagen_url,
    ...(producto.imagenes_extra || [])
  ].filter(Boolean) : [];

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

  const abrirChat = () => {
    if (!producto.vendedores?.id_usuario) {
      alert("No se puede contactar con este vendedor.");
      return;
    }
    router.push(`/chat?producto=${producto.id}&vendedor=${producto.vendedores.id_usuario}`);
  };

  const enviarOferta = async () => {
    if (!precioOferta || Number(precioOferta) <= 0) return alert("Introduce un precio válido");
    setEnviandoOferta(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Inicia sesión para hacer ofertas"); setEnviandoOferta(false); return; }

    const { error } = await supabase.from('ofertas').insert([{
      id_comprador: user.id,
      id_producto: producto.id,
      id_vendedor: producto.vendedores?.id,
      precio_oferta: Number(precioOferta)
    }]);

    if (error) {
      alert("Error al enviar la oferta.");
    } else {
      alert(`¡Oferta de ${precioOferta}€ enviada al vendedor! 🤝`);
      // Crear notificación para el vendedor
      await supabase.from('notificaciones').insert([{
        id_usuario: producto.vendedores?.id_usuario,
        tipo: 'oferta',
        titulo: 'Nueva oferta recibida',
        mensaje: `Oferta de ${precioOferta}€ en ${producto.nombre}`,
        enlace: '/dashboard'
      }]);
      setMostrarOferta(false);
      setPrecioOferta('');
    }
    setEnviandoOferta(false);
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
        
        {/* COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES */}
        <div className="relative group">
          <div className="sticky top-28">
            {/* IMAGEN PRINCIPAL */}
            <div className="rounded-[3rem] overflow-hidden bg-[#f9f9f9] dark:bg-zinc-900 shadow-2xl border border-gray-100 dark:border-zinc-800 mb-4">
              {todasLasImagenes[imagenActiva] ? (
                <img 
                  src={todasLasImagenes[imagenActiva]} 
                  alt={producto.nombre} 
                  className="w-full h-full object-cover aspect-[4/5] transition-all duration-500" 
                />
              ) : (
                <div className="aspect-[4/5] flex items-center justify-center text-gray-300 dark:text-zinc-800 font-black">SIN IMAGEN</div>
              )}
              
              {/* BADGES */}
              {producto.destacado && (
                <div className="absolute top-6 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-2xl shadow-amber-500/30 animate-pulse z-10">
                  🔥 DESTACADO
                </div>
              )}
              <div className="absolute top-8 left-8 bg-black/80 backdrop-blur-xl text-white px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
                Talla: {producto.talla || 'Única'}
              </div>
              
              {/* VERIFICACIÓN */}
              {todasLasImagenes.length > 1 && (
                <div className="absolute bottom-6 left-6 bg-green-500/90 backdrop-blur-xl text-white px-3 py-1.5 rounded-xl font-black text-[8px] uppercase tracking-widest shadow-xl">
                  ✓ {todasLasImagenes.length} Fotos Verificadas
                </div>
              )}
            </div>

            {/* THUMBNAILS */}
            {todasLasImagenes.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {todasLasImagenes.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setImagenActiva(idx)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      imagenActiva === idx 
                        ? 'border-blue-600 shadow-lg shadow-blue-500/20 scale-105' 
                        : 'border-gray-100 dark:border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* MINI GRÁFICO HISTORIAL DE PRECIOS */}
            {historialPrecios.length > 1 && (
              <div className="mt-6 p-5 rounded-[2rem] border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">📈 Historial de Precio</p>
                <div className="flex items-end gap-1 h-16">
                  {historialPrecios.map((h, i) => {
                    const max = Math.max(...historialPrecios.map(p => p.precio));
                    const min = Math.min(...historialPrecios.map(p => p.precio));
                    const range = max - min || 1;
                    const height = ((h.precio - min) / range) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div 
                          className="w-full bg-blue-500/30 rounded-t-md hover:bg-blue-500/60 transition-colors cursor-pointer"
                          style={{ height: `${Math.max(height, 10)}%` }}
                        />
                        <span className="text-[7px] text-gray-400 font-bold">
                          {new Date(h.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] font-bold text-gray-400">Min: {Math.min(...historialPrecios.map(p => p.precio))}€</span>
                  <span className="text-[8px] font-bold text-blue-500">Actual: {producto.precio}€</span>
                  <span className="text-[8px] font-bold text-gray-400">Max: {Math.max(...historialPrecios.map(p => p.precio))}€</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: INFO */}
        <div className="flex flex-col justify-center">
          <div className="mb-10">
            <div className="flex gap-2 mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] border border-blue-100 dark:border-blue-800/30">
                Autenticado ✓
              </span>
              {todasLasImagenes.length > 1 && (
                <span className="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-[0.2em] border border-green-100 dark:border-green-800/30">
                  {todasLasImagenes.length} Fotos ✓
                </span>
              )}
            </div>
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

            {/* BOTÓN HACER OFERTA */}
            <button 
              onClick={() => setMostrarOferta(!mostrarOferta)}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition active:scale-95 flex justify-center items-center gap-3 shadow-xl shadow-green-500/20"
            >
              <span>🤝</span> Hacer Oferta
            </button>

            {/* PANEL DE OFERTA */}
            {mostrarOferta && (
              <div className="p-6 rounded-[2rem] border-2 border-green-200 dark:border-green-800/30 bg-green-50/50 dark:bg-green-900/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black uppercase tracking-widest text-green-600">Tu contraoferta</p>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={precioOferta}
                    onChange={(e) => setPrecioOferta(e.target.value)}
                    placeholder={`Precio actual: ${producto.precio}€`}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 px-5 py-4 rounded-2xl text-lg font-black outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={enviarOferta}
                    disabled={enviandoOferta}
                    className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {enviandoOferta ? '...' : 'Enviar'}
                  </button>
                </div>
                <p className="text-[8px] text-gray-400 font-bold">El vendedor recibirá una notificación con tu oferta</p>
              </div>
            )}
            
            {/* CHAT */}
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