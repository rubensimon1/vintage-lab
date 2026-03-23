'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/bibliotecas/supabase'; // Importante importar supabase
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function Checkout() {
  const [items, setItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [completado, setCompletado] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  // --- CUPONES ---
  const [codigoCupon, setCodigoCupon] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState<any>(null);
  const [cargandoCupon, setCargandoCupon] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const cestaGuardada = JSON.parse(localStorage.getItem('cesta') || '[]');
    if (cestaGuardada.length === 0 && !completado) {
      router.push('/');
    }
    setItems(cestaGuardada);
    const suma = cestaGuardada.reduce((acc: number, item: any) => acc + Number(item.precio), 0);
    setSubtotal(suma);
  }, [router, completado]);

  const aplicarCupon = async () => {
    if (!codigoCupon.trim()) return;
    setCargandoCupon(true);
    
    const { data: cupon, error } = await supabase
      .from('cupones')
      .select('*')
      .eq('codigo', codigoCupon.toUpperCase().trim())
      .single();
      
    if (error || !cupon || !cupon.activo || cupon.usos >= cupon.max_usos) {
      alert('Cupón no válido, inactivo o sin usos restantes.');
      setCuponAplicado(null);
    } else {
      setCuponAplicado(cupon);
      setCodigoCupon('');
    }
    setCargandoCupon(false);
  };

  const descuentoMonto = cuponAplicado ? (subtotal * (cuponAplicado.descuento / 100)) : 0;
  const totalFinal = subtotal - descuentoMonto;

  const finalizarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Guardamos el cupón para procesar los usos a la vuelta del pago
      if (cuponAplicado) {
        localStorage.setItem('cuponAplicado', JSON.stringify(cuponAplicado));
      } else {
        localStorage.removeItem('cuponAplicado');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items, // que es la cesta
          email: user?.email || '', 
          cuponId: cuponAplicado?.id,
          descuento: cuponAplicado ? cuponAplicado.descuento : 0
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Error de Stripe:", data.error);
        alert("Hubo un problema al iniciar el pago. Revisa la consola.");
        setCargando(false);
      }

    } catch (error: any) {
      console.error("Error en la compra:", error);
      alert("Hubo un fallo al procesar el pedido con Stripe. Inténtalo de nuevo.");
      setCargando(false);
    }
  };

  if (completado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] px-6 text-center">
        <div className="max-w-md">
          <div className="text-6xl mb-6">✨</div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase italic">¡Pedido Confirmado!</h1>
          <p className="text-gray-500 dark:text-zinc-400 mb-10 font-medium">
            Tu compra ha sido registrada en el sistema. Puedes ver tus pedidos en tu perfil.
          </p>
          <Link href="/" className="bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest inline-block hover:scale-105 transition">
            Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-gray-100 dark:border-zinc-900">
        <Link href="/cesta" className="text-[10px] font-black uppercase tracking-widest hover:text-blue-600 transition">← Volver a la Cesta</Link>
        <ThemeToggle />
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-10 uppercase italic">Detalles de Envío</h2>
          <form onSubmit={finalizarCompra} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nombre" className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" required />
              <input type="text" placeholder="Apellidos" className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" required />
            </div>
            <input type="email" placeholder="Email" className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" required />
            <input type="text" placeholder="Dirección completa" className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 font-bold" required />
            
            <div className="pt-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Método de Pago</h3>
              <div className="p-4 rounded-2xl border-2 border-black dark:border-white flex justify-between items-center">
                <span className="font-bold">Tarjeta de Crédito / Débito</span>
                <span className="text-xl">💳</span>
              </div>
            </div>

            <button 
              disabled={cargando}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition disabled:opacity-50 mt-6"
            >
              {cargando ? 'Guardando Pedido...' : `Confirmar y Pagar ${totalFinal.toFixed(2)} €`}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-900/50 p-10 rounded-[3rem] h-fit sticky top-32">
          <h3 className="text-xl font-black mb-8">Resumen</h3>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">{item.nombre}</span>
                <span className="font-bold">{item.precio} €</span>
              </div>
            ))}
          </div>

          <div className="space-y-4 mb-8 pt-4 border-t border-gray-200 dark:border-zinc-800 text-sm font-bold text-gray-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-black dark:text-white">{subtotal.toFixed(2)}€</span>
            </div>
            {cuponAplicado && (
              <div className="flex justify-between text-green-500">
                <span>Descuento ({cuponAplicado.codigo} {cuponAplicado.descuento}%)</span>
                <span>-{descuentoMonto.toFixed(2)}€</span>
              </div>
            )}
          </div>

          {/* INPUT DE CUPÓN */}
          <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              value={codigoCupon}
              onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
              placeholder="CÓDIGO DE CUPÓN" 
              className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-zinc-800 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 transition"
            />
            <button 
              onClick={(e) => { e.preventDefault(); aplicarCupon(); }}
              disabled={cargandoCupon || !codigoCupon}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-50"
            >
              {cargandoCupon ? '...' : 'Aplicar'}
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-zinc-800 pt-6 flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Final</span>
            <span className="text-4xl font-black">{totalFinal.toFixed(2)} €</span>
          </div>
        </div>
      </main>
    </div>
  );
}