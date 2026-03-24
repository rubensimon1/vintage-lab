'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/bibliotecas/supabase';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function LandingPro() {
  const [cargando, setCargando] = useState(false);
  const [yaEsPro, setYaEsPro] = useState(false);

  // Comprobar si ya es PRO al montar el componente
  useEffect(() => {
    if (localStorage.getItem('vintage_lab_pro') === 'true') {
      setYaEsPro(true);
    }
  }, []);

  const iniciarSuscripcion = async () => {
    setCargando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Debes iniciar sesión para hacerte PRO.");
      window.location.href = '/auth';
      return;
    }

    try {
      const resp = await fetch('/api/stripe-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error(error);
      alert('Error iniciando el pago seguro: ' + error.message);
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-white selection:bg-purple-500/30 font-sans transition-colors duration-500 overflow-x-hidden">
      
      {/* NAVEGACIÓN */}
      <nav className="p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto fixed top-0 w-full left-1/2 -translate-x-1/2 z-50 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10">
        <Link href="/" className="font-black italic text-xl uppercase tracking-tighter hover:opacity-70 transition flex items-center gap-2">
          Vintage<span className="text-purple-600">.</span>Lab
          <span className="bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">PRO</span>
        </Link>
        <ThemeToggle />
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-purple-600/10 dark:bg-purple-900/20 blur-[80px] md:blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-pink-600/5 dark:bg-pink-900/10 blur-[60px] md:blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-6 py-2 rounded-full border border-purple-500/30 bg-purple-100 dark:bg-purple-900/20 mb-8 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 dark:text-purple-300">Desbloquea el nivel definitivo</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-8 leading-[0.9] uppercase">
            EL MERCADO NUNCA <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 animate-pulse">
              VOLVERÁ A SER IGUAL
            </span>
          </h1>

          <p className="text-zinc-600 dark:text-gray-400 text-base md:text-xl max-w-2xl mx-auto mb-12 font-medium">
            Accede a drops anticipados, envíos gratuitos y consigue tu ansiada insignia de comprador verificado Premium por menos de lo que cuesta un café en resell.
          </p>

          {yaEsPro ? (
            <Link 
              href="/"
              className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-xs uppercase tracking-widest text-white transition-all duration-300 bg-black dark:bg-white dark:text-black border border-black dark:border-white/10 rounded-full hover:scale-105 shadow-[0_0_40px_rgba(168,85,247,0.3)]"
            >
              ¡YA ERES PRO! VOLVER AL MERCADO 🛍️
            </Link>
          ) : (
            <button 
              onClick={iniciarSuscripcion}
              disabled={cargando}
              className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-xs uppercase tracking-widest text-zinc-900 dark:text-white transition-all duration-300 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black overflow-hidden hover:scale-105 shadow-xl md:shadow-none"
            >
              <div className="absolute inset-0 w-1/4 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:animate-shine"></div>
              {cargando ? 'Procesando Stripe...' : 'Hacerme PRO por 9.99€/mes'}
              <span className="ml-3 text-xl group-hover:rotate-12 transition-transform">💎</span>
            </button>
          )}
          <p className="text-[9px] text-zinc-400 dark:text-gray-600 font-bold uppercase tracking-widest mt-6">Cancela o pausa en cualquier momento. Procesado por Stripe.</p>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-24 md:py-32 px-6 border-t border-zinc-100 dark:border-white/5 bg-gradient-to-b from-transparent to-zinc-50 dark:to-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic text-center mb-16 md:mb-24 text-zinc-900 dark:text-white/90">
            Ventajas Exclusivas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
              <span className="text-4xl md:text-5xl mb-6 block">⏱️</span>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-4 text-purple-600 dark:text-purple-400">Early Access</h3>
              <p className="text-zinc-600 dark:text-gray-400 font-medium text-sm leading-relaxed">
                Podrás comprar cualquier prenda o Sneaker de los mejores vendedores 30 minutos antes de que aparezcan públicos en el feed del resto de mortales.
              </p>
            </div>

            <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors xl:-translate-y-8 shadow-sm dark:shadow-none">
              <span className="text-4xl md:text-5xl mb-6 block">💎</span>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-4 text-pink-600 dark:text-pink-400">Badge VIP Global</h3>
              <p className="text-zinc-600 dark:text-gray-400 font-medium text-sm leading-relaxed">
                Tu nombre en la app, al comentar en TikTok y de cara a los vendedores lucirá brillante. Harán rebajas más fácilmente al verte.
              </p>
            </div>

            <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
              <span className="text-4xl md:text-5xl mb-6 block">🚚</span>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-4 text-orange-600 dark:text-orange-400">Zero Shipping</h3>
              <p className="text-zinc-600 dark:text-gray-400 font-medium text-sm leading-relaxed">
                Olvídate de pagar comisiones de gestión y gastos de envío. Nosotros negociamos y asumimos el coste con la paquetería directamente.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
