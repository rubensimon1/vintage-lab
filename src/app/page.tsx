'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../componentes/ThemeToggle';
import BotonFavorito from '@/componentes/BotonFavorito';

export default function Home() {
  const [productos, setProductos] = useState<any[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [cantidadCesta, setCantidadCesta] = useState(0);
  const [categoriaActiva, setCategoriaActiva] = useState('Todo');
  const [tallaActiva, setTallaActiva] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [precioMax, setPrecioMax] = useState(2000);
  const router = useRouter();

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);
      
      const cesta = JSON.parse(localStorage.getItem('cesta') || '[]');
      setCantidadCesta(cesta.length);

      const { data } = await supabase
        .from('productos')
        .select('*, vendedores(id, nombre_tienda)')
        .order('ventas_count', { ascending: false }) 
        .order('creado_el', { ascending: false });

      if (data) { 
        setProductos(data); 
        setProductosFiltrados(data); 
      }
      setCargando(false);
    }
    cargarDatos();
  }, []);

  // 🔥 LÓGICA DE FILTRADO ACTUALIZADA
  useEffect(() => {
    let resultado = productos;

    if (categoriaActiva !== 'Todo') {
      resultado = resultado.filter(p => p.categoria?.toLowerCase() === categoriaActiva.toLowerCase());
    }

    if (tallaActiva !== 'Todas') {
      resultado = resultado.filter(p => p.talla === tallaActiva);
    }

    if (busqueda) {
      resultado = resultado.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    }

    resultado = resultado.filter(p => Number(p.precio) <= precioMax);

    // Destacados primero
    resultado.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));

    setProductosFiltrados(resultado);
  }, [categoriaActiva, tallaActiva, busqueda, productos, precioMax]);

  // Resetear talla cuando cambia la categoría (si ya no es Sneakers)
  useEffect(() => {
    if (categoriaActiva !== 'Todo' && categoriaActiva !== 'Sneakers') {
      setTallaActiva('Todas');
    }
  }, [categoriaActiva]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500 overflow-x-hidden">
      
      {/* TICKER DE BOLSA */}
      <div className="bg-black dark:bg-white text-white dark:text-black py-2 overflow-hidden whitespace-nowrap border-b border-zinc-800">
        <div className="inline-block animate-marquee font-black text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.3em]">
          NIKE +12.4% ▲ &nbsp;&nbsp; ADIDAS -2.1% ▼ &nbsp;&nbsp; JORDAN +5.8% ▲ &nbsp;&nbsp; VINTAGE +15.2% ▲ &nbsp;&nbsp; 
          NIKE +12.4% ▲ &nbsp;&nbsp; ADIDAS -2.1% ▼ &nbsp;&nbsp; JORDAN +5.8% ▲ &nbsp;&nbsp; VINTAGE +15.2% ▲ &nbsp;&nbsp;
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="border-b border-gray-100 dark:border-zinc-900 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase italic flex-shrink-0 hover:opacity-70 transition-opacity">
            V<span className="hidden sm:inline">INTAGE</span><span className="text-blue-600">.</span>L<span className="hidden sm:inline">AB</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />

            <Link href="/favoritos" className="p-2 md:p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:scale-105 transition-transform">
              <span className="text-base md:text-lg">❤️</span>
            </Link>

            <Link href="/cesta" className="relative p-2 md:p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full hover:scale-105 transition-transform">
              <span className="text-base md:text-lg">🛍️</span>
              {cantidadCesta > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#0a0a0a]">
                  {cantidadCesta}
                </span>
              )}
            </Link>

            {usuario ? (
              <div className="flex items-center gap-2 md:gap-4 border-l border-gray-100 dark:border-zinc-800 pl-2 md:pl-4 ml-1 md:ml-2">
                <Link href="/dashboard" className="text-[9px] md:text-[10px] font-black bg-black dark:bg-white text-white dark:text-black px-3 py-2 md:px-5 md:py-2.5 rounded-full whitespace-nowrap hover:opacity-80 transition">
                  PANEL
                </Link>
                <button onClick={cerrarSesion} className="text-[9px] md:text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 transition">
                  Salir
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-[9px] md:text-[10px] font-black bg-black dark:bg-white text-white dark:text-black px-4 py-2 md:px-6 md:py-2.5 rounded-full ml-1 md:ml-2 hover:opacity-80 transition">
                LOGIN
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-zinc-900 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/20 dark:from-blue-900/10 via-transparent to-transparent"></div>
        <div className="relative text-center w-full max-w-5xl mx-auto">
          <span className="text-[8px] md:text-[10px] font-black tracking-[0.3em] md:tracking-[0.4em] text-blue-600 dark:text-blue-400 uppercase mb-4 md:mb-6 block">The New Era of Resell</span>
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-8 md:mb-12 uppercase italic">
            DROP <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-black via-zinc-400 to-black dark:from-white dark:via-zinc-500 dark:to-white">
              FASTER.
            </span>
          </h1>
        </div>
      </section>

      {/* BARRA DE FILTROS AVANZADA & RESPONSIVE */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-12 md:-mt-16 relative z-10">
        <div className="bg-white dark:bg-[#0f0f0f] p-4 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800">
          <div className="flex flex-col gap-6">
            
            {/* FILA 1: BUSCADOR & TALLA (En PC van juntos, en móvil uno sobre otro) */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* BUSCADOR */}
              <div className="relative w-full md:flex-1">
                <input 
                  type="text"
                  placeholder="BUSCAR ITEM..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-transparent px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
              </div>

              {/* TALLAS (Solo visible para Sneakers o Todo) */}
              {(categoriaActiva === 'Todo' || categoriaActiva === 'Sneakers') && (
              <div className="w-full md:w-auto flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="text-[7px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2 md:hidden">Tallas Sneakers</span>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 px-1">
                  {['Todas', '38', '39', '40', '41', '42', '43', '44', '45'].map((t) => (
                    <button 
                      key={t} 
                      onClick={() => setTallaActiva(t)}
                      className={`h-10 min-w-[42px] px-3 rounded-xl border text-[9px] font-black uppercase transition-all flex items-center justify-center flex-shrink-0 ${
                        tallaActiva === t 
                        ? 'bg-black text-white border-black dark:bg-white dark:text-black shadow-lg' 
                        : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-400 hover:border-blue-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* FILA 2: CATEGORÍAS */}
            <div className="border-t border-gray-100 dark:border-zinc-900 pt-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {['Todo', 'Sneakers', 'Streetwear', 'Accesorios', 'Vintage'].map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => setCategoriaActiva(cat)}
                    className={`px-6 py-3 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${
                      categoriaActiva === cat 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                      : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-400 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* FILA 3: RANGO DE PRECIO */}
            <div className="border-t border-gray-100 dark:border-zinc-900 pt-4">
              <div className="flex items-center gap-4">
                <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest flex-shrink-0">Precio Máx</span>
                <input
                  type="range"
                  min={10}
                  max={2000}
                  step={10}
                  value={precioMax}
                  onChange={(e) => setPrecioMax(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-black text-blue-600 min-w-[60px] text-right">{precioMax}€</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* GRID PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        {cargando ? (
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
            {[1,2,3,4,5].map(i => <div key={i} className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-[2.5rem]"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-16">
            {productosFiltrados.map((prod) => (
              <div key={prod.id} className="group block">
                
                <div className="block relative aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-[#f9f9f9] dark:bg-zinc-900 mb-4 md:mb-6 transition-all border border-gray-50 dark:border-zinc-900 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                  
                  <BotonFavorito productoId={prod.id} usuarioId={usuario?.id} />

                  <Link href={`/producto/${prod.id}`}>
                    <img src={prod.imagen_url || '/placeholder.png'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={prod.nombre} />
                    
                    {/* BADGE DESTACADO */}
                    {prod.destacado && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest z-10 shadow-lg shadow-amber-500/30 animate-pulse">
                        🔥 HOT
                      </div>
                    )}

                    {/* BADGE TALLA */}
                    <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase z-10">
                      T: {prod.talla || '—'}
                    </div>

                    <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 z-10">
                      <span className="bg-white/90 dark:bg-black/80 dark:text-white backdrop-blur-xl px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs shadow-xl tracking-tighter">
                        {prod.precio}€
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="px-1 md:px-2">
                  {prod.vendedores?.id && (
                    <Link href={`/tienda/${prod.vendedores.id}`} className="text-[7px] md:text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-1 truncate hover:underline block">
                      {prod.vendedores?.nombre_tienda}
                    </Link>
                  )}
                  <Link href={`/producto/${prod.id}`}>
                    <h3 className="font-bold text-[10px] md:text-sm leading-tight uppercase italic tracking-tighter truncate group-hover:text-blue-600 transition-colors">
                      {prod.nombre}
                    </h3>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 dark:border-zinc-900 py-16 text-center">
        <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">© 2026 VINTAGE LAB SYSTEMS — THE NEW STANDARD</p>
      </footer>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 20s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}