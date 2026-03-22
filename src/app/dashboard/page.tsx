'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/componentes/ThemeToggle';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [productos, setProductos] = useState<any[]>([]);
  const [pedidosRecibidos, setPedidosRecibidos] = useState<any[]>([]);
  const [mensajesNuevos, setMensajesNuevos] = useState(0); // 🔥 Novedad: Contador de mensajes
  const [tienda, setTienda] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({ ingresos: 0, ventasContador: 0, valorStock: 0 });
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [pestaña, setPestaña] = useState<'inventario' | 'envios' | 'mensajes'>('inventario'); // 🔥 Añadida pestaña mensajes
  const router = useRouter();

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: vendedor } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id_usuario', user.id)
      .single();

    if (vendedor) {
      setTienda(vendedor);

      // INVENTARIO
      const { data: prods } = await supabase
        .from('productos')
        .select('*')
        .eq('id_vendedor', vendedor.id)
        .order('creado_el', { ascending: false });

      if (prods) {
        setProductos(prods);
        const valorActual = prods.reduce((acc, p) => acc + Number(p.precio), 0);
        setStats(prev => ({ ...prev, valorStock: valorActual }));
      }

      // VENTAS / PEDIDOS RECIBIDOS
      const { data: ventasReales } = await supabase
        .from('pedido_items')
        .select(`
          *, 
          productos!inner(nombre, id_vendedor, imagen_url), 
          pedidos!inner(id, creado_el, estado, tracking_url)
        `)
        .eq('productos.id_vendedor', vendedor.id)
        .order('pedidos(creado_el)', { ascending: false });

      if (ventasReales) {
        const totalDinero = ventasReales.reduce((acc, item) => acc + Number(item.precio), 0);
        setStats(prev => ({ ...prev, ingresos: totalDinero, ventasContador: ventasReales.length }));
        
        const pedidosAgrupados = ventasReales.reduce((acc: any, item: any) => {
          const id = item.pedidos.id;
          if (!acc[id]) {
            acc[id] = {
              id: id,
              fecha: item.pedidos.creado_el,
              estado: item.pedidos.estado || 'Preparando',
              tracking_url: item.pedidos.tracking_url,
              items: []
            };
          }
          acc[id].items.push(item);
          return acc;
        }, {});

        const arrayPedidos = Object.values(pedidosAgrupados).sort((a: any, b: any) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        setPedidosRecibidos(arrayPedidos);

        // GRAFICA
        const ventasPorDia = ventasReales.reduce((acc: any, item: any) => {
          const fecha = new Date(item.pedidos.creado_el).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
          if (!acc[fecha]) acc[fecha] = 0;
          acc[fecha] += Number(item.precio);
          return acc;
        }, {});

        const formatoGrafico = Object.keys(ventasPorDia).map(fecha => ({
          name: fecha,
          Ingresos: ventasPorDia[fecha]
        })).reverse();

        setDatosGrafico(formatoGrafico);
      }

      // 🔥 CARGAR CONTEO DE MENSAJES SIN LEER
      const { count } = await supabase
        .from('mensajes')
        .select('*', { count: 'exact', head: true })
        .eq('id_receptor', user.id)
        .eq('leido', false);
      
      if (count !== null) setMensajesNuevos(count);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [router]);

  const actualizarEstadoPedido = async (idPedido: string, nuevoEstado: string) => {
    let urlTracking = null;
    if (nuevoEstado === 'Enviado') {
      urlTracking = prompt('Introduce el enlace de seguimiento (opcional):');
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ 
        estado: nuevoEstado, 
        ...(urlTracking && { tracking_url: urlTracking }) 
      })
      .eq('id', idPedido);

    if (!error) {
      alert(`✅ Pedido actualizado a: ${nuevoEstado}`);
      setPedidosRecibidos(pedidosRecibidos.map(p => 
        p.id === idPedido ? { ...p, estado: nuevoEstado, tracking_url: urlTracking || p.tracking_url } : p
      ));
    }
  };

  const eliminarProducto = async (id: string, nombre: string) => {
    const confirmar = confirm(`¿Estás seguro de eliminar "${nombre}"?`);
    if (confirmar) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) setProductos(productos.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#070707] text-black dark:text-white transition-colors duration-500 overflow-x-hidden">
      
      <header className="border-b border-gray-100 dark:border-zinc-900 bg-white/80 dark:bg-[#070707]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition">← Tienda</Link>
            <h1 className="font-black italic text-xl tracking-tighter uppercase">Panel<span className="text-blue-600">.</span>Lab</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard/nuevo-producto" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
              + Nuevo Item
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        
        {/* INDICADORES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Ingresos</p>
            <h3 className="text-4xl font-black tracking-tighter italic">{stats.ingresos}€</h3>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Ventas</p>
            <h3 className="text-4xl font-black tracking-tighter italic">{stats.ventasContador}</h3>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Stock</p>
            <h3 className="text-4xl font-black tracking-tighter italic">{stats.valorStock}€</h3>
          </div>
          {/* 🔥 ACCESO DIRECTO A MENSAJES */}
          <Link href="/dashboard/mensajes" className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-xl hover:scale-105 transition-all group">
            <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest group-hover:opacity-100">Bandeja de Entrada</p>
            <div className="flex justify-between items-center">
              <h3 className="text-4xl font-black tracking-tighter italic">Chats</h3>
              {mensajesNuevos > 0 && <span className="bg-white text-blue-600 text-[10px] font-black px-3 py-1 rounded-full animate-bounce">{mensajesNuevos}</span>}
            </div>
          </Link>
        </div>

        {/* GRÁFICO */}
        <div className="hidden lg:block bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm mb-16">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest">Rendimiento de Ventas</p>
          <div className="h-[250px] w-full">
            {datosGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} tickFormatter={(value) => `${value}€`} />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '12px' }} itemStyle={{ color: '#2563eb', fontWeight: 900 }} />
                  <Area type="monotone" dataKey="Ingresos" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorIngresos)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase text-gray-300 tracking-widest border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-3xl">Sin datos</div>
            )}
          </div>
        </div>

        {/* 🔥 PESTAÑAS */}
        <div className="flex gap-4 mb-10 border-b border-gray-200 dark:border-zinc-800 pb-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setPestaña('inventario')} className={`text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all whitespace-nowrap ${pestaña === 'inventario' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}>📦 Inventario</button>
          <button onClick={() => setPestaña('envios')} className={`text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all whitespace-nowrap relative ${pestaña === 'envios' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}>
            🚚 Envíos {pedidosRecibidos.filter(p => p.estado === 'Preparando').length > 0 && <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px]">{pedidosRecibidos.filter(p => p.estado === 'Preparando').length}</span>}
          </button>
          <Link href="/dashboard/mensajes" className="text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 whitespace-nowrap">💬 Ir al Inbox</Link>
        </div>

        {/* CONTENIDO PESTAÑAS */}
        {pestaña === 'inventario' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
            {productos.map((prod) => (
              <div key={prod.id} className="group bg-white dark:bg-zinc-900/50 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-zinc-800 transition-all">
                <div className="aspect-[4/5] relative overflow-hidden bg-gray-50 dark:bg-zinc-800">
                  <img src={prod.imagen_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={prod.nombre} />
                  <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-1.5 rounded-xl font-black text-[9px]">{prod.talla || 'T:—'}</div>
                </div>
                <div className="p-4 md:p-6 text-center">
                  <h3 className="font-bold text-[10px] truncate mb-4 uppercase tracking-tighter">{prod.nombre}</h3>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/editar/${prod.id}`} className="flex-1 bg-gray-100 dark:bg-zinc-800 text-[8px] font-black py-2 rounded-xl uppercase">Editar</Link>
                    <button onClick={() => eliminarProducto(prod.id, prod.nombre)} className="px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LISTA DE ENVÍOS */
          <div className="space-y-4">
             {pedidosRecibidos.map((pedido) => (
                <div key={pedido.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex flex-col md:flex-row gap-6 items-center">
                   <div className="flex-1">
                      <div className="flex gap-2 mb-2">
                        <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-1 rounded-md uppercase">{pedido.estado}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">{new Date(pedido.fecha).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-sm uppercase tracking-tighter">Pedido #{pedido.id.substring(0,8)}</h4>
                      <p className="text-[10px] text-gray-500">{pedido.items.length} artículos comprados</p>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                      {pedido.estado === 'Preparando' && <button onClick={() => actualizarEstadoPedido(pedido.id, 'Enviado')} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase">Enviar 📦</button>}
                      {pedido.estado === 'Enviado' && <button onClick={() => actualizarEstadoPedido(pedido.id, 'Entregado')} className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase">Entregar ✓</button>}
                   </div>
                </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
}