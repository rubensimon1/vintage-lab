'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function MisCompras() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const facturaRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- ESTADOS PARA LA RESEÑA ---
  const [pedidoAValorar, setPedidoAValorar] = useState<any>(null);
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviandoResena, setEnviandoResena] = useState(false);

  useEffect(() => {
    async function cargarPedidos() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🔥 FIX: Pedimos id_vendedor y comprobamos si ya hay reseña
      const { data } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_items (
            id,
            precio,
            productos (nombre, id_vendedor)
          ),
          resenas (id)
        `)
        .eq('id_usuario', user.id)
        .order('creado_el', { ascending: false });

      if (data) setPedidos(data);
      setCargando(false);
    }
    cargarPedidos();
  }, []);

  // --- 🔥 DESCARGA DE PDF ---
  const descargarPDF = async (pedidoId: string) => {
    const facturaElement = facturaRefs.current[pedidoId];
    if (!facturaElement) return alert("No se pudo encontrar el documento.");

    try {
      const canvas = await html2canvas(facturaElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VINTAGELAB_INVOICE_${pedidoId.substring(0, 8).toUpperCase()}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Fallo en la captura del documento.");
    }
  };

  const descargarExcel = (pedido: any) => {
    const encabezados = ["Pedido ID", "Fecha", "Producto", "Total"];
    const filas = pedido.pedido_items.map((item: any) => [
      pedido.id.substring(0, 8),
      new Date(pedido.creado_el).toLocaleDateString(),
      item.productos?.nombre,
      `${item.precio}€`
    ]);
    let csv = "data:text/csv;charset=utf-8," + [encabezados, ...filas].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `VINTAGELAB_DATA_${pedido.id.substring(0, 8)}.csv`;
    link.click();
  };

  // --- 🔥 FUNCIÓN PARA ENVIAR LA RESEÑA ---
  const enviarResena = async () => {
    if (!pedidoAValorar || comentario.trim() === '') {
      return alert("Por favor, escribe un breve comentario.");
    }
    
    setEnviandoResena(true);
    
    // Obtenemos el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    // Asumimos que valoramos al vendedor del primer producto del pedido
    const idVendedor = pedidoAValorar.pedido_items[0]?.productos?.id_vendedor;

    if (!user || !idVendedor) {
      alert("Error al identificar al vendedor.");
      setEnviandoResena(false);
      return;
    }

    const { error } = await supabase.from('resenas').insert([{
      id_comprador: user.id,
      id_vendedor: idVendedor,
      id_pedido: pedidoAValorar.id,
      puntuacion: estrellas,
      comentario: comentario
    }]);

    if (error) {
      alert("Ya has valorado este pedido o hubo un error.");
    } else {
      alert("¡Reseña publicada con éxito! ⭐");
      // Actualizamos el estado local para que desaparezca el botón
      setPedidos(pedidos.map(p => p.id === pedidoAValorar.id ? { ...p, resenas: [{ id: 'fake-id' }] } : p));
      setPedidoAValorar(null);
      setComentario('');
      setEstrellas(5);
    }
    setEnviandoResena(false);
  };

  const obtenerPaso = (estado: string) => {
    const est = estado?.toUpperCase();
    if (est === 'ENTREGADO' || est === 'COMPLETADO') return 3;
    if (est === 'ENVIADO') return 2;
    return 1;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500 relative">
      
      {/* NAVBAR */}
      <nav className="border-b border-gray-100 dark:border-zinc-900 p-6 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-black tracking-tighter uppercase italic hover:opacity-70 transition">
            VINTAGE<span className="text-blue-600">.</span>LAB
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition">Panel</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-16 text-center md:text-left">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] block mb-4">Customer Archive</span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase leading-none">Mis Compras</h1>
        </header>

        {cargando ? (
           <div className="space-y-8">
            {[1, 2].map(i => <div key={i} className="h-64 bg-gray-50 dark:bg-zinc-900/50 rounded-[3rem] animate-pulse"></div>)}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-[3rem]">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">Vault is empty</p>
            <Link href="/" className="inline-block mt-6 px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:scale-105 transition">Explorar Drops</Link>
          </div>
        ) : (
          <div className="space-y-12">
            {pedidos.map((pedido) => {
              const pasoActual = obtenerPaso(pedido.estado);
              const yaValorado = pedido.resenas && pedido.resenas.length > 0;

              return (
                <div key={`card-${pedido.id}`} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-800 rounded-[3rem] p-8 md:p-14 shadow-2xl shadow-black/5 transition-all duration-500">
                  
                  {/* CABECERA TARJETA */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 border-b border-gray-100 dark:border-zinc-800 pb-10">
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                        {new Date(pedido.creado_el).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Ref: {pedido.id}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                      <button onClick={() => descargarExcel(pedido)} className="flex-1 md:flex-none h-14 px-6 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all font-black text-[10px] uppercase tracking-widest gap-2">
                        <span>📊</span> CSV
                      </button>
                      <button onClick={() => descargarPDF(pedido.id)} className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95">
                        PDF 📥
                      </button>
                    </div>
                  </div>

                  {/* BARRA DE TRACKING */}
                  <div className="mb-14 bg-gray-50 dark:bg-zinc-900/50 p-6 md:p-10 rounded-[2rem] border border-gray-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-8">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado del envío</p>
                      
                      {/* 🔥 BOTÓN DE VALORACIÓN (Solo si está entregado y no valorado) */}
                      {pasoActual === 3 && !yaValorado && (
                        <button 
                          onClick={() => setPedidoAValorar(pedido)}
                          className="bg-yellow-400 text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 hover:scale-105 transition-all animate-pulse"
                        >
                          Valorar Vendedor ⭐
                        </button>
                      )}
                      {pasoActual === 3 && yaValorado && (
                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Reseña Enviada ✓</span>
                      )}
                    </div>
                    
                    <div className="relative flex items-center justify-between w-full">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full z-0"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-blue-600 rounded-full z-0 transition-all duration-1000 ease-out" style={{ width: pasoActual === 1 ? '0%' : pasoActual === 2 ? '50%' : '100%' }}></div>

                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm border-4 transition-colors duration-500 ${pasoActual >= 1 ? 'bg-blue-600 border-blue-200 dark:border-blue-900 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-400'}`}>
                          {pasoActual > 1 ? '✓' : '1'}
                        </div>
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${pasoActual >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>Preparando</span>
                      </div>

                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm border-4 transition-colors duration-500 ${pasoActual >= 2 ? 'bg-blue-600 border-blue-200 dark:border-blue-900 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-400'}`}>
                          {pasoActual > 2 ? '✓' : '2'}
                        </div>
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${pasoActual >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>Enviado</span>
                      </div>

                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm border-4 transition-colors duration-500 ${pasoActual === 3 ? 'bg-green-500 border-green-200 dark:border-green-900 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-400'}`}>
                          3
                        </div>
                        <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${pasoActual === 3 ? 'text-green-500' : 'text-gray-400'}`}>Entregado</span>
                      </div>
                    </div>
                  </div>

                  {/* DETALLE PRODUCTOS */}
                  <div className="space-y-6">
                    {pedido.pedido_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-lg font-bold uppercase italic tracking-tight">{item.productos?.nombre || 'Item'}</span>
                        <span className="text-lg font-black italic">{item.precio}€</span>
                      </div>
                    ))}
                  </div>

                  {/* TEMPLATE OCULTO PARA PDF... */}
                  <div className="absolute top-[-9999px] left-[-9999px] z-[-1] opacity-0 pointer-events-none">
                    <div ref={(el) => { facturaRefs.current[pedido.id] = el }} style={{ width: '800px', padding: '60px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' }}>
                      {/* Contenido mínimo para que no de error el PDF */}
                      <h1 style={{ fontSize: '30px' }}>Factura {pedido.id.substring(0,8)}</h1>
                      <p>Total: {pedido.total}€</p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 🔥 MODAL DE RESEÑA FLOTANTE */}
      {pedidoAValorar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111] p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-lg w-full border border-gray-100 dark:border-zinc-800 relative animate-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setPedidoAValorar(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold hover:bg-black hover:text-white transition"
            >
              ✕
            </button>

            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-center">Valora tu compra</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-10">Ayuda a otros compradores</p>

            {/* ESTRELLAS DINÁMICAS */}
            <div className="flex justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setEstrellas(num)}
                  className={`text-5xl transition-all ${estrellas >= num ? 'grayscale-0 scale-110' : 'grayscale opacity-30 hover:opacity-60 scale-90'}`}
                >
                  ⭐
                </button>
              ))}
            </div>

            {/* COMENTARIO */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Tu Opinión</label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="¿Qué te ha parecido el artículo y el trato del vendedor?"
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 text-sm resize-none h-32 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button 
              onClick={enviarResena}
              disabled={enviandoResena}
              className="w-full bg-blue-600 text-white py-5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] transition active:scale-95 disabled:opacity-50"
            >
              {enviandoResena ? 'Enviando...' : 'Publicar Reseña 🚀'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}