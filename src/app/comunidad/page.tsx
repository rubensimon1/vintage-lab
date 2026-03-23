'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function ComunidadPage() {
  const [outfits, setOutfits] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaFoto, setNuevaFoto] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);

      const { data } = await supabase
        .from('outfits')
        .select('*')
        .order('creado_el', { ascending: false });

      if (data) setOutfits(data);
      setCargando(false);
    }
    cargar();
  }, []);

  const subirOutfit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaFoto || !usuario) return;
    setSubiendo(true);

    try {
      const ext = nuevaFoto.name.split('.').pop();
      const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const path = `outfits/${filename}`;

      // 1. Subir imagen a Storage (Reusamos el bucket de 'fotos' por comodidad o 'tienda_media')
      const { error: uploadError } = await supabase.storage.from('fotos').upload(path, nuevaFoto);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(path);

      // 2. Guardar en Base de Datos (en "outfits")
      const { error: dbError } = await supabase.from('outfits').insert([{
        id_usuario: usuario.id,
        imagen_url: publicUrl,
        descripcion: descripcion
      }]);

      if (dbError) throw dbError;

      alert('¡Outfit publicado con éxito! 📸');
      setMostrarModal(false);
      window.location.reload();
    } catch (err: any) {
      alert("Error al subir outfit: " + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500">
      
      {/* NAVBAR */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-gray-100 dark:border-zinc-900 sticky top-0 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-black italic text-xl uppercase tracking-tighter hover:opacity-70 transition">
            Vintage<span className="text-blue-600">.</span>Lab
          </Link>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-[0.5rem] font-bold text-[8px] uppercase tracking-widest leading-none rotate-3">Comunidad</span>
        </div>
        
        <div className="flex items-center gap-6">
          <ThemeToggle />
          {usuario ? (
            <button 
              onClick={() => setMostrarModal(true)}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition shadow-lg"
            >
              + Subir Outfit
            </button>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition shadow-lg shadow-blue-500/20">
              Unete para publicar
            </Link>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="text-center py-20 px-6 max-w-4xl mx-auto">
         <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-6 leading-[0.85]">
            GET <span className="text-blue-600">INSPIRED</span>
         </h1>
         <p className="text-gray-500 font-bold uppercase tracking-widest text-xs max-w-lg mx-auto leading-relaxed">
            Descubre cómo nuestra comunidad combina las prendas de Vintage Lab. Inspírate, comparte tus mejores *fits* y construye tu marca personal.
         </p>
      </section>

      {/* MASONRY GRID (Pinterest Style) */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        {cargando ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-[3rem]">
            <span className="text-6xl mb-6 block opacity-50 grayscale">📸</span>
            <p className="font-black uppercase tracking-widest text-sm text-gray-500">Sé el primero en subir un outfit</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {outfits.map((outfit) => (
              <div key={outfit.id} className="break-inside-avoid relative group rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 transition-all hover:shadow-2xl">
                <img 
                  src={outfit.imagen_url} 
                  alt={outfit.descripcion}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  {outfit.descripcion && (
                    <p className="text-white text-sm font-bold leading-snug mb-3">"{outfit.descripcion}"</p>
                  )}
                  <div className="flex items-center justify-between">
                     <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">{new Date(outfit.creado_el).toLocaleDateString()}</span>
                     <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                       <span className="text-lg">❤️</span>
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE SUBIDA */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-md w-full bg-white dark:bg-[#111] p-8 rounded-[3rem] border border-gray-200 dark:border-zinc-800 shadow-2xl relative">
            <button onClick={() => setMostrarModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center hover:scale-110 transition">✕</button>
            
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8">Sube tu Outfit 📸</h2>
            
            <form onSubmit={subirOutfit} className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-[2rem] h-48 flex items-center justify-center relative overflow-hidden group hover:border-blue-500 transition-colors">
                 {nuevaFoto ? (
                   <img src={URL.createObjectURL(nuevaFoto)} className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center p-6">
                      <span className="text-3xl mb-2 block">📷</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-500">Haz clic para buscar foto</p>
                   </div>
                 )}
                 <input type="file" required accept="image/*" onChange={(e) => setNuevaFoto(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Descripción / Fit Info</label>
                <textarea 
                  required
                  placeholder="Ej: Jordan 1 Retro con Cargo Pants Vintage de los 90s..." 
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full p-5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl outline-none focus:border-blue-500 transition text-sm font-bold"
                  rows={3}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={subiendo}
                className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition active:scale-95 disabled:opacity-50"
              >
                {subiendo ? 'Publicando...' : 'Compartir con la comunidad'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
