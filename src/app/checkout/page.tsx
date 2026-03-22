'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/bibliotecas/supabase'; // Importante importar supabase
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function Checkout() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [completado, setCompletado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cestaGuardada = JSON.parse(localStorage.getItem('cesta') || '[]');
    if (cestaGuardada.length === 0 && !completado) {
      router.push('/');
    }
    setItems(cestaGuardada);
    const suma = cestaGuardada.reduce((acc: number, item: any) => acc + Number(item.precio), 0);
    setTotal(suma);
  }, [router, completado]);

  const finalizarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      // 1. Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();

      // Recogemos los datos del formulario (Nombre, Apellidos, Direccion)
      const form = e.target as HTMLFormElement;
      const nombreCompleto = `${(form[0] as HTMLInputElement).value} ${(form[1] as HTMLInputElement).value}`;
      const direccionEnvio = (form[3] as HTMLInputElement).value;

      // 2. Insertar el Pedido principal
      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          id_usuario: user?.id || null, 
          total: total,
          nombre_cliente: nombreCompleto,
          direccion: direccionEnvio,
          estado: 'completado'
        })
        .select()
        .single();

      if (errorPedido) throw errorPedido;

      // 3. Insertar los items del pedido (el detalle)
      const itemsParaInsertar = items.map(item => ({
        id_pedido: pedido.id,
        id_producto: item.id,
        nombre_producto: item.nombre,
        precio: item.precio
      }));

      const { error: errorItems } = await supabase
        .from('pedido_items')
        .insert(itemsParaInsertar);

      if (errorItems) throw errorItems;

      // 4. Éxito: Limpiar LocalStorage y mostrar pantalla final
      localStorage.removeItem('cesta');
      setCompletado(true);

    } catch (error: any) {
      console.error("Error en la compra:", error);
      alert("Hubo un fallo al procesar el pedido. Inténtalo de nuevo.");
    } finally {
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
              className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition disabled:opacity-50"
            >
              {cargando ? 'Guardando Pedido...' : `Pagar ${total} €`}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 dark:bg-zinc-900/50 p-10 rounded-[3rem] h-fit sticky top-32">
          <h3 className="text-xl font-black mb-8">Resumen</h3>
          <div className="space-y-4 mb-8">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">{item.nombre}</span>
                <span className="font-bold">{item.precio} €</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-zinc-800 pt-6 flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest">Total Final</span>
            <span className="text-4xl font-black">{total} €</span>
          </div>
        </div>
      </main>
    </div>
  );
}