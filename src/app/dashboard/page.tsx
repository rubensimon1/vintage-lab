'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/componentes/ThemeToggle';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const [productos, setProductos] = useState<any[]>([]);
  const [pedidosRecibidos, setPedidosRecibidos] = useState<any[]>([]);
  const [misCompras, setMisCompras] = useState<any[]>([]);
  const [mensajesNuevos, setMensajesNuevos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({ ingresos: 0, ventasContador: 0, valorStock: 0 });
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [pestaña, setPestaña] = useState<'inventario' | 'envios' | 'compras' | 'cupones' | 'ofertas'>('inventario');
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [cupones, setCupones] = useState<any[]>([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [nuevoCupon, setNuevoCupon] = useState({ codigo: '', descuento: 10 });
  const [vendedorInfo, setVendedorInfo] = useState<any>(null);
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
      setVendedorInfo(vendedor);
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

      const { data: ventasReales } = await supabase
        .from('pedido_items')
        .select(`
          *, 
          productos!inner(nombre, id_vendedor, imagen_url), 
          pedidos!inner(id, creado_el, estado, tracking_url)
        `)
        .eq('productos.id_vendedor', vendedor.id);

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
        const pedidosOrdenados = Object.values(pedidosAgrupados).sort((a: any, b: any) =>
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        setPedidosRecibidos(pedidosOrdenados);

        // Formatear datos para el gráfico (ingresos + pedidos por día)
        const ventasPorDia = ventasReales.reduce((acc: any, item: any) => {
          const fecha = new Date(item.pedidos.creado_el).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
          if (!acc[fecha]) acc[fecha] = { ingresos: 0, pedidos: new Set() };
          acc[fecha].ingresos += Number(item.precio);
          acc[fecha].pedidos.add(item.pedidos.id);
          return acc;
        }, {});
        const formatoGrafico = Object.keys(ventasPorDia).map(fecha => ({
          name: fecha, 
          Ingresos: Math.round(ventasPorDia[fecha].ingresos * 100) / 100,
          Pedidos: ventasPorDia[fecha].pedidos.size
        })).reverse();
        setDatosGrafico(formatoGrafico);
      }

      // Cargar extras (cupones, ofertas, notificaciones)
      await cargarExtras(vendedor.id, user.id);
    }

    const { data: misPedidos } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_items (*, productos (nombre, imagen_url, id_vendedor)),
        resenas (id)
      `)
      .eq('id_usuario', user.id)
      .order('creado_el', { ascending: false });

    if (misPedidos) setMisCompras(misPedidos);

    const { count } = await supabase
      .from('mensajes')
      .select('*', { count: 'exact', head: true })
      .eq('id_receptor', user.id)
      .eq('leido', false);
    if (count !== null) setMensajesNuevos(count);

    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [router]);

  // Cargar ofertas y cupones del vendedor
  const cargarExtras = async (vendedorId: string, userId: string) => {
    const { data: ofertasData } = await supabase
      .from('ofertas')
      .select('*, productos(nombre, imagen_url, precio)')
      .eq('id_vendedor', vendedorId)
      .order('creado_el', { ascending: false });
    if (ofertasData) setOfertas(ofertasData);

    const { data: cuponesData } = await supabase
      .from('cupones')
      .select('*')
      .eq('id_vendedor', vendedorId)
      .order('creado_el', { ascending: false });
    if (cuponesData) setCupones(cuponesData);

    const { count } = await supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('id_usuario', userId)
      .eq('leido', false);
    setNotificacionesNoLeidas(count || 0);
  };



  const actualizarEstadoPedido = async (idPedido: string, nuevoEstado: string) => {
    const updatePayload: { estado: string; tracking_url?: string | null } = { estado: nuevoEstado };
    if (nuevoEstado === 'Enviado') {
      const valorIngresado = prompt('Introduce el enlace de seguimiento:');
      if (valorIngresado !== null) {
        const limpio = valorIngresado.trim();
        updatePayload.tracking_url = limpio || null;
      }
    }
    const { error } = await supabase
      .from('pedidos')
      .update(updatePayload)
      .eq('id', idPedido);

    if (!error) {
      // 🔥 Notificar al comprador del cambio de estado
      const { data: pedidoData } = await supabase.from('pedidos').select('id_usuario').eq('id', idPedido).single();
      if (pedidoData) {
        await supabase.from('notificaciones').insert([{
           id_usuario: pedidoData.id_usuario,
           mensaje: `📦 Tu pedido #${idPedido.substring(0,8)} ahora está: ${nuevoEstado}`,
           tipo: 'envio'
        }]);
      }

      alert(`✅ Actualizado`);
      cargarDatos();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#070707] text-black dark:text-white transition-colors duration-500">
      
      <header className="border-b border-gray-100 dark:border-zinc-900 bg-white/80 dark:bg-[#070707]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-400">← Tienda</Link>
            <h1 className="font-black italic text-xl tracking-tighter uppercase">Panel<span className="text-blue-600">.</span>Lab</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard/notificaciones" className="relative p-2.5 bg-gray-100 dark:bg-zinc-900 rounded-full hover:scale-105 transition">
              <span className="text-lg">🔔</span>
              {notificacionesNoLeidas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[#070707] animate-bounce">
                  {notificacionesNoLeidas}
                </span>
              )}
            </Link>
            <Link href="/dashboard/nuevo-producto" className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest">+ Nuevo Item</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        
        {/* INDICADORES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Ingresos</p>
            <h3 className="text-4xl font-black italic tracking-tighter">{stats.ingresos}€</h3>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Ventas</p>
            <h3 className="text-4xl font-black italic tracking-tighter">{stats.ventasContador}</h3>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Valor Stock</p>
            <h3 className="text-4xl font-black italic tracking-tighter">{stats.valorStock}€</h3>
          </div>
          <Link href="/dashboard/mensajes" className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-xl hover:scale-105 transition-all group">
            <p className="text-[10px] font-black uppercase opacity-60 mb-2 italic tracking-widest group-hover:opacity-100">Conversaciones</p>
            <div className="flex justify-between items-center">
              <h3 className="text-4xl font-black italic tracking-tighter">Inbox</h3>
              {mensajesNuevos > 0 && <span className="bg-white text-blue-600 text-[10px] font-black px-3 py-1 rounded-full animate-bounce">{mensajesNuevos}</span>}
            </div>
          </Link>
        </div>

        {/* GRÁFICO DE VENTAS — ESTILO BOLSA */}
        <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Rendimiento de Ventas</p>
              <p className="text-[8px] font-bold text-gray-300 dark:text-zinc-600 uppercase tracking-widest mt-1">Ingresos (€) + Pedidos por día</p>
            </div>
            {datosGrafico.length > 0 && (
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500/60"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Pedidos</span>
                </div>
              </div>
            )}
          </div>
          <div className="w-full h-[220px] md:h-[320px]">
            {datosGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={datosGrafico} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 700 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 700 }} tickFormatter={(v) => `${v}€`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#10b981', fontWeight: 700 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.2rem', border: 'none', fontWeight: 'bold', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', padding: '16px 20px' }} 
                    formatter={(value: any, name: any) => {
                      if (name === 'Ingresos') return [`${value}€`, '💰 Ingresos'];
                      return [value, '📦 Pedidos'];
                    }}
                    labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}
                  />
                  <Bar yAxisId="right" dataKey="Pedidos" fill="#10b981" opacity={0.5} radius={[6, 6, 0, 0]} barSize={24} />
                  <Area yAxisId="left" type="monotone" dataKey="Ingresos" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <span className="text-4xl opacity-10">📈</span>
                <p className="opacity-20 text-[10px] font-black uppercase tracking-widest">Aún no hay datos de ventas</p>
              </div>
            )}
          </div>
        </div>

        {/* PESTAÑAS */}
        <div className="flex gap-2 md:gap-4 mb-10 border-b border-gray-200 dark:border-zinc-800 pb-4 overflow-x-auto no-scrollbar">
          <button onClick={() => setPestaña('inventario')} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest px-4 md:px-6 py-3 rounded-full transition-all flex-shrink-0 ${pestaña === 'inventario' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-400'}`}>📦 Inventario</button>
          <button onClick={() => setPestaña('envios')} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest px-4 md:px-6 py-3 rounded-full transition-all flex-shrink-0 ${pestaña === 'envios' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>🚚 Envíos</button>
          <button onClick={() => setPestaña('compras')} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest px-4 md:px-6 py-3 rounded-full transition-all flex-shrink-0 ${pestaña === 'compras' ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' : 'text-gray-400'}`}>🛍️ Compras</button>
          <button onClick={() => setPestaña('cupones')} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest px-4 md:px-6 py-3 rounded-full transition-all flex-shrink-0 ${pestaña === 'cupones' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400'}`}>🏷️ Cupones</button>
          <button onClick={() => setPestaña('ofertas')} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest px-4 md:px-6 py-3 rounded-full transition-all flex-shrink-0 ${pestaña === 'ofertas' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400'}`}>🤝 Ofertas{ofertas.filter(o => o.estado === 'pendiente').length > 0 ? ` (${ofertas.filter(o => o.estado === 'pendiente').length})` : ''}</button>
          {vendedorInfo && <button onClick={() => router.push(`/tienda/${vendedorInfo.id}`)} className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest px-4 md:px-6 py-3 rounded-full transition-all flex-shrink-0 text-gray-400 hover:text-orange-500`}>⚙️ Editar Perfil Público</button>}
        </div>

        {/* CONTENIDOS */}
        {cargando ? (
          <div className="h-64 bg-gray-100 dark:bg-zinc-900 animate-pulse rounded-[3rem]"></div>
        ) : pestaña === 'inventario' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {productos.map((prod) => (
              <div key={prod.id} className="group bg-white dark:bg-zinc-900/50 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-zinc-800">
                <div className="aspect-[4/5] relative overflow-hidden bg-gray-50 dark:bg-zinc-800">
                  <img src={prod.imagen_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={prod.nombre} />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-[10px] truncate uppercase mb-4 tracking-tighter">{prod.nombre}</h3>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/editar/${prod.id}`} className="flex-1 bg-gray-100 dark:bg-zinc-800 text-[8px] font-black py-2 rounded-xl uppercase">Editar</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pestaña === 'envios' ? (
          <div className="space-y-6">
             {pedidosRecibidos.map((pedido) => (
                <div key={pedido.id} className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 transition-all hover:border-blue-500/50">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                     <div>
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${pedido.estado === 'Enviado' ? 'bg-blue-500 text-white' : pedido.estado === 'Entregado' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'}`}>{pedido.estado}</span>
                       <h4 className="font-bold text-sm uppercase tracking-tighter mt-2">Pedido #{pedido.id.substring(0,8)}</h4>
                       <p className="text-[10px] text-gray-400 font-bold">{new Date(pedido.fecha).toLocaleDateString()} · {pedido.items.length} {pedido.items.length === 1 ? 'unidad' : 'unidades'}</p>
                     </div>
                     <div className="flex gap-2 flex-shrink-0">
                       <button onClick={() => {
                         const v = window.open('', '_blank');
                         if(!v) return;
                         v.document.write(`
                           <html>
                             <head><title>Etiqueta #${pedido.id}</title></head>
                             <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                               <div style="border: 4px solid black; padding: 40px; max-width: 400px; margin: auto; text-align: left;">
                                 <h1 style="font-size: 32px; margin-bottom: 0; text-transform: uppercase;">VINTAGE LAB</h1>
                                 <p style="font-weight: bold; font-size: 14px; margin-top: 0; margin-bottom: 30px;">📦 EXPRESS MAIL</p>
                                 <hr style="border: 2px solid black; margin-bottom: 20px;" />
                                 <h3 style="margin-bottom: 5px;">ENVIAR A:</h3>
                                 <p style="font-size: 20px; font-weight: bold; margin-top: 0;">Cliente Verificado</p>
                                 <p style="font-size: 14px; margin-bottom: 30px;">ID TRANSACCIÓN: ${pedido.id}<br/>
                                 ${pedido.legit_check ? '<strong style="color:red;">⚠️ ATENCIÓN: ENVIAR A OFICINAS PARA LEGIT CHECK</strong>' : 'Envio Directo Estandar'}
                                 </p>
                                 <hr style="border: 2px dashed black; margin-bottom: 20px;" />
                                 <div style="padding: 20px; border: 2px solid black; text-align: center; font-family: monospace; font-size: 24px;">|||| ||||| ||||| |||| |||||</div>
                               </div>
                               <script>
                                 window.print();
                               </script>
                             </body>
                           </html>
                         `);
                       }} className="bg-black dark:bg-white text-white dark:text-black px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:scale-105 transition">🖨️ PDF Etiqueta</button>
                       {pedido.estado === 'Preparando' && <button onClick={() => actualizarEstadoPedido(pedido.id, 'Enviado')} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition">Marcar Enviado 📦</button>}
                       {pedido.estado === 'Enviado' && <button onClick={() => actualizarEstadoPedido(pedido.id, 'Entregado')} className="bg-green-600 text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 transition">Marcar Entregado ✓</button>}
                     </div>
                   </div>
                   {/* ITEMS DEL PEDIDO CON FOTO */}
                   <div className="space-y-3 border-t border-gray-100 dark:border-zinc-800 pt-4">
                     {pedido.items.map((item: any, idx: number) => (
                       <div key={idx} className="flex items-center gap-4">
                         <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-800 flex-shrink-0 border border-gray-100 dark:border-zinc-700">
                           <img src={item.productos?.imagen_url || '/placeholder.png'} alt={item.productos?.nombre || 'Producto'} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="font-black uppercase text-xs tracking-tighter italic truncate">{item.productos?.nombre || 'Producto'}</p>
                           <p className="text-[10px] text-gray-400 font-bold">{item.precio}€</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
             ))}
          </div>
        ) : pestaña === 'compras' ? (
          <div className="space-y-6">
            {misCompras.length === 0 ? (
              <div className="text-center py-20 opacity-30 italic text-xs font-bold uppercase tracking-widest">No has realizado compras todavía.</div>
            ) : (
              misCompras.map((compra) => {
                const yaValorado = compra.resenas && compra.resenas.length > 0;
                return (
                  <div key={compra.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-gray-100 dark:border-zinc-800 flex flex-col gap-6 transition-all hover:shadow-xl">
                    <div className="flex flex-col md:flex-row gap-8 justify-between">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-4">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${compra.estado === 'Enviado' ? 'bg-blue-500 text-white' : compra.estado === 'Entregado' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                            {compra.estado || 'Procesando'}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 py-1.5 tracking-tighter">{new Date(compra.creado_el).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-4">
                          {compra.pedido_items?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-4">
                              <img src={item.productos?.imagen_url} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 dark:border-zinc-800" alt="product" />
                              <p className="font-black uppercase text-xs tracking-tighter italic">{item.productos?.nombre}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 min-w-[200px]">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acciones</p>
                        {compra.tracking_url && compra.tracking_url.startsWith('http') && (
                          <a href={compra.tracking_url} target="_blank" rel="noopener noreferrer" className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition">Seguir Envío 🚚</a>
                        )}
                        {compra.tracking_url && !compra.tracking_url.startsWith('http') && (
                          <div className="w-full bg-gray-50 dark:bg-zinc-800 py-4 px-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest">
                            📦 Tracking: {compra.tracking_url}
                          </div>
                        )}
                        <Link href="/compras" className="w-full border-2 border-gray-100 dark:border-zinc-800 py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-zinc-800 transition">Detalles y PDF 📄</Link>
                      </div>
                    </div>

                    {/* ESTADO DE VALORACIÓN */}
                    {compra.estado === 'Entregado' && !yaValorado && (
                      <Link href="/compras" className="mt-4 flex items-center justify-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition">
                        <span className="text-[10px] font-black uppercase text-yellow-600 tracking-widest">⭐ Valorar esta compra en Mis Compras →</span>
                      </Link>
                    )}
                    {yaValorado && (
                       <p className="text-center text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 dark:bg-green-900/10 py-2 rounded-xl">✓ Compra valorada</p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        ) : pestaña === 'cupones' ? (
          <div className="space-y-8">
            {/* CREAR CUPÓN */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800">
              <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-6">Crear Nuevo Cupón</p>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="CÓDIGO (ej: VERANO20)"
                  value={nuevoCupon.codigo}
                  onChange={(e) => setNuevoCupon(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                  className="flex-1 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={nuevoCupon.descuento}
                    onChange={(e) => setNuevoCupon(prev => ({ ...prev, descuento: Number(e.target.value) }))}
                    className="w-24 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-4 rounded-2xl text-sm font-black text-center outline-none focus:ring-2 focus:ring-purple-500"
                    min={1} max={90}
                  />
                  <span className="text-lg font-black">%</span>
                </div>
                <button
                  onClick={async () => {
                    if (!nuevoCupon.codigo) return alert('Introduce un código');
                    const { data: { user } } = await supabase.auth.getUser();
                    const { data: vendedor } = await supabase.from('vendedores').select('id').eq('id_usuario', user?.id).single();
                    if (!vendedor) return;
                    await supabase.from('cupones').insert([{ id_vendedor: vendedor.id, codigo: nuevoCupon.codigo, descuento: nuevoCupon.descuento }]);
                    setNuevoCupon({ codigo: '', descuento: 10 });
                    cargarDatos();
                  }}
                  className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition shadow-lg shadow-purple-500/20"
                >
                  Crear
                </button>
              </div>
            </div>

            {/* LISTA DE CUPONES */}
            {cupones.length === 0 ? (
              <div className="text-center py-20 opacity-30 italic text-xs font-bold uppercase tracking-widest">No tienes cupones creados.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cupones.map((c) => (
                  <div key={c.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="text-xl font-black tracking-tighter">{c.codigo}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{c.descuento}% dto · {c.usos} usos</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${c.activo ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                      {c.activo ? 'Activo' : 'Desactivado'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : pestaña === 'ofertas' ? (
          <div className="space-y-6">
            {ofertas.length === 0 ? (
              <div className="text-center py-20 opacity-30 italic text-xs font-bold uppercase tracking-widest">No has recibido ofertas.</div>
            ) : (
              ofertas.map((o) => (
                <div key={o.id} className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800">
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={o.productos?.imagen_url || '/placeholder.png'} alt="" className="w-16 h-16 rounded-2xl object-cover border border-gray-100 dark:border-zinc-800" />
                      <div>
                        <p className="font-black uppercase text-sm tracking-tighter italic">{o.productos?.nombre}</p>
                        <p className="text-[10px] text-gray-400 font-bold">Precio actual: {o.productos?.precio}€</p>
                        <p className="text-lg font-black text-emerald-600 mt-1">Oferta: {o.precio_oferta}€</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {o.estado === 'pendiente' ? (
                        <>
                          <button onClick={async () => { await supabase.from('ofertas').update({ estado: 'aceptada' }).eq('id', o.id); cargarDatos(); alert('✅ Oferta aceptada'); }} className="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition">Aceptar</button>
                          <button onClick={async () => { await supabase.from('ofertas').update({ estado: 'rechazada' }).eq('id', o.id); cargarDatos(); }} className="bg-red-500 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition">Rechazar</button>
                        </>
                      ) : (
                        <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${o.estado === 'aceptada' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                          {o.estado}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold mt-3">{new Date(o.creado_el).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}