'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/bibliotecas/supabase';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function PagoExito() {
  const [procesando, setProcesando] = useState(true);

  useEffect(() => {
    async function registrarCompra() {
      // 1. Leemos lo que había en la cesta justo antes de pagar
      const cestaGuardada = localStorage.getItem('cesta');
      if (!cestaGuardada) {
        setProcesando(false);
        return;
      }

      const cesta = JSON.parse(cestaGuardada);
      if (cesta.length === 0) {
        setProcesando(false);
        return;
      }

      // 2. Calculamos el total
      const total = cesta.reduce((acc: number, item: any) => acc + Number(item.precio), 0);

      // 3. Obtenemos el usuario comprador
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 4. Creamos el PEDIDO en la base de datos
        const isLegitCheck = localStorage.getItem('legitCheckStatus') === 'true';
        const { data: nuevoPedido, error: errorPedido } = await supabase
          .from('pedidos')
          .insert([{ 
            id_usuario: user.id, 
            total: total + (isLegitCheck ? 3.99 : 0),
            estado: 'Preparando', // Empieza desde aquí para el Tracking
            legit_check: isLegitCheck
          }])
          .select()
          .single();

        // 5. Metemos los items dentro del pedido
        if (nuevoPedido && !errorPedido) {
          const itemsAInsertar = cesta.map((item: any) => ({
            id_pedido: nuevoPedido.id,
            id_producto: item.id,
            precio: item.precio
          }));

          await supabase.from('pedido_items').insert(itemsAInsertar);
        }
      }

      // 6. Vaciamos variables locales
      localStorage.removeItem('cesta');
      localStorage.removeItem('legitCheckStatus');

      // 7. Usos de Cupón
      const cuponGuardado = localStorage.getItem('cuponAplicado');
      if (cuponGuardado) {
        const cuponAplicado = JSON.parse(cuponGuardado);
        await supabase.from('cupones').update({ usos: cuponAplicado.usos + 1 }).eq('id', cuponAplicado.id);
        localStorage.removeItem('cuponAplicado');
      }
      
      // Añadimos un pequeño retraso para que el usuario vea que "estamos trabajando"
      setTimeout(() => {
        setProcesando(false);
      }, 1500);
    }

    registrarCompra();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500 flex flex-col">
      
      {/* NAVBAR SIMPLE */}
      <nav className="p-6 flex justify-between items-center max-w-5xl mx-auto w-full border-b border-gray-100 dark:border-zinc-900">
        <Link href="/" className="font-black italic text-xl uppercase tracking-tighter hover:opacity-70 transition">
          Vintage<span className="text-blue-600">.</span>Lab
        </Link>
        <ThemeToggle />
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {procesando ? (
          <div className="space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-blue-600">Procesando Transacción...</p>
          </div>
        ) : (
          <div className="max-w-2xl w-full bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-zinc-800 p-10 md:p-16 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500">
            
            {/* ICONO ÉXITO */}
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <span className="text-white text-4xl font-black">✓</span>
            </div>

            <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] mb-4">
              Pago Verificado
            </p>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none mb-6">
              Transacción <br/> Exitosa
            </h1>
            
            <p className="text-gray-500 dark:text-gray-400 font-bold mb-10 max-w-sm mx-auto text-sm">
              Tu pedido ha sido procesado por Stripe y los vendedores han sido notificados. 
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href="/compras" className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition">
                Ver mi Pedido 📦
              </Link>
              <Link href="/" className="border-2 border-black dark:border-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition">
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="py-10 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em]">Vintage Lab Secure Checkout</p>
      </footer>
    </div>
  );
}