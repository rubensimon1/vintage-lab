'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';
import { supabase } from '@/bibliotecas/supabase';

export default function Cesta() {
  const [cesta, setCesta] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [cargandoPago, setCargandoPago] = useState(false);

  useEffect(() => {
    // Cargar la cesta guardada en el navegador
    const cestaGuardada = JSON.parse(localStorage.getItem('cesta') || '[]');
    setCesta(cestaGuardada);

    // Calcular el total
    const suma = cestaGuardada.reduce((acc: number, item: any) => acc + Number(item.precio), 0);
    setTotal(suma);
  }, []);

  const eliminarItem = (id: string) => {
    const nuevaCesta = cesta.filter((item) => item.id !== id);
    setCesta(nuevaCesta);
    localStorage.setItem('cesta', JSON.stringify(nuevaCesta));
    
    const nuevaSuma = nuevaCesta.reduce((acc: number, item: any) => acc + Number(item.precio), 0);
    setTotal(nuevaSuma);
  };

  // --- 🔥 CONEXIÓN CON STRIPE ---
  const procesarPagoStripe = async () => {
    if (cesta.length === 0) return;
    setCargandoPago(true);

    try {
      // 1. Vemos si el usuario está logueado para autocompletar su email en Stripe
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Llamamos a nuestra API de Checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cesta,
          email: user?.email || '', // Pasamos el email si existe
        }),
      });

      const data = await response.json();

      // 3. Si Stripe nos devuelve la URL segura, redirigimos al usuario
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Error de Stripe:", data.error);
        alert("Hubo un problema al iniciar el pago. Revisa la consola.");
        setCargandoPago(false);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con la pasarela de pago.");
      setCargandoPago(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500 flex flex-col">
      
      {/* NAVBAR */}
      <nav className="p-6 flex justify-between items-center max-w-5xl mx-auto w-full border-b border-gray-100 dark:border-zinc-900">
        <Link href="/" className="font-black italic text-xl uppercase tracking-tighter hover:opacity-70 transition">
          Vintage<span className="text-blue-600">.</span>Lab
        </Link>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition">
            ← Seguir Comprando
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 md:py-20">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic mb-12">Tu Cesta</h1>

        {cesta.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-gray-100 dark:border-zinc-900 rounded-[3rem]">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-6">Tu cesta está vacía</p>
            <Link href="/" className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition">
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-24">
            
            {/* LISTA DE ARTÍCULOS */}
            <div className="lg:col-span-2 space-y-6">
              {cesta.map((item) => (
                <div key={item.id} className="flex gap-6 items-center p-4 md:p-6 bg-[#f9f9f9] dark:bg-zinc-900/50 rounded-[2rem] border border-gray-100 dark:border-zinc-800">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 flex-shrink-0">
                    <img src={item.imagen || '/placeholder.png'} alt={item.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{item.tienda || 'Vintage Lab'}</p>
                    <h3 className="text-lg md:text-xl font-bold uppercase italic tracking-tighter leading-tight mb-2">{item.nombre}</h3>
                    <p className="text-xl font-black">{item.precio}€</p>
                  </div>
                  <button 
                    onClick={() => eliminarItem(item.id)}
                    className="w-10 h-10 flex items-center justify-center bg-white dark:bg-black rounded-full text-red-500 hover:bg-red-500 hover:text-white transition shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* RESUMEN Y PAGO (STRIPE) */}
            <div className="bg-gray-50 dark:bg-[#111] p-8 md:p-10 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 h-fit sticky top-32">
              <h2 className="text-lg font-black uppercase tracking-widest mb-8 border-b border-gray-200 dark:border-zinc-800 pb-4">Resumen</h2>
              
              <div className="space-y-4 mb-8 text-sm font-bold text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-black dark:text-white">{total}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Autenticación</span>
                  <span className="text-green-500">GRATIS</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío Express</span>
                  <span className="text-green-500">GRATIS</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-gray-200 dark:border-zinc-800 pt-6 mb-8">
                <span className="text-[10px] font-black uppercase tracking-widest">Total</span>
                <span className="text-5xl font-black italic tracking-tighter">{total}€</span>
              </div>

              {/* BOTÓN MÁGICO DE STRIPE */}
              <button 
                onClick={procesarPagoStripe}
                disabled={cargandoPago}
                className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] transition active:scale-95 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoPago ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Conectando...
                  </span>
                ) : (
                  'PAGAR DE FORMA SEGURA 🔒'
                )}
              </button>
              
              <div className="mt-6 flex justify-center items-center gap-2 opacity-30 grayscale">
                {/* Iconos simulados de pago para dar confianza */}
                <div className="text-[10px] font-black tracking-widest uppercase">STRIPE SECURE CHECKOUT</div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}