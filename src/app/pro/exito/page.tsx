'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutProExito() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Simulamos la lógica de activar PRO en el cliente para el MVP,
    // (en producción esto sucedería mediante Webhooks de Stripe al backend de Supabase)
    localStorage.setItem('vintage_lab_pro', 'true');
    setTimeout(() => setCargando(false), 1500);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6 text-center text-white relative overflow-hidden">
      
      {/* Background radial */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/30 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        
        {cargando ? (
          <div className="flex flex-col items-center gap-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
            <p className="font-black uppercase tracking-[0.3em] text-xs text-purple-400">Activando súper poderes...</p>
          </div>
        ) : (
          <>
            <div className="text-8xl mb-6">💎</div>
            <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase italic">¡Ya eres PRO!</h1>
            <p className="text-gray-400 mb-10 font-medium text-lg leading-relaxed">
              Bienvenido al club exclusivo. Tu membresía está activa. A partir de ahora disfrutarás de envíos gratuitos, acceso a los drops anticipados y lucirás la insignia VIP en toda la plataforma.
            </p>
            <Link href="/" className="bg-white text-black px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] inline-block hover:scale-105 hover:shadow-2xl hover:shadow-white/20 transition-all">
              EMPEZAR A PRESUMIR
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
