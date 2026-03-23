'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function TikTokShowcase() {
  const [videos, setVideos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [videoActivo, setVideoActivo] = useState(0);

  // Estados de subida
  const [mostrarModalSubida, setMostrarModalSubida] = useState(false);
  const [archivoVideo, setArchivoVideo] = useState<File | null>(null);
  const [descripcionVideo, setDescripcionVideo] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  // Estados Comentarios
  const [comentariosActivos, setComentariosActivos] = useState<string | null>(null); // Guarda el ID del video
  const [listaComentarios, setListaComentarios] = useState<any[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');

  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);
      
      const { data } = await supabase
        .from('videos_showcase')
        .select('*')
        .order('creado_el', { ascending: false });
        
      if (data) setVideos(data);
      setCargando(false);
    }
    init();
  }, []);

  // Lógica de Autoplay al hacer Scroll (Intersection Observer)
  useEffect(() => {
    const options = { root: null, rootMargin: "0px", threshold: 0.6 };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.play().catch(e => console.log("Autoplay bloqued:", e));
          setVideoActivo(Number(video.dataset.index));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, options);

    videoRefs.current.forEach((video) => {
      if (video) observerRef.current?.observe(video);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [videos]);

  const subirVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoVideo || !usuario) return;
    
    // Comprobar tamaño (Por ejemplo, max 50MB)
    const MAX_MB = 50;
    if (archivoVideo.size > MAX_MB * 1024 * 1024) {
      alert(`El vídeo pesa ${(archivoVideo.size / (1024 * 1024)).toFixed(1)}MB. El límite actual es de ${MAX_MB}MB.`);
      return;
    }

    setSubiendo(true);

    try {
      const ext = archivoVideo.name.split('.').pop();
      const filename = `tiktok_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const path = `showcase/${filename}`;

      // Upload limitations handling might be needed depending on the Supabase plan, but we'll throw it to the 'fotos' bucket
      const { error: uploadError } = await supabase.storage.from('fotos').upload(path, archivoVideo);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(path);

      const { error: dbError } = await supabase.from('videos_showcase').insert([{
        id_usuario: usuario.id,
        video_url: publicUrl,
        descripcion: descripcionVideo
      }]);

      if (dbError) throw dbError;

      alert('¡Vídeo publicado con éxito en el Showcase! 🎥');
      setMostrarModalSubida(false);
      window.location.reload();
    } catch (err: any) {
      alert("Error al subir el vídeo: " + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const darLike = async (id: string, index: number) => {
    if (!usuario) { alert("Inicia sesión para dar Like ❤️"); return; }
    const video = videos[index];
    const nuevosLikes = video.likes + 1;
    
    // UI Optimista
    const nuevosVideos = [...videos];
    nuevosVideos[index].likes = nuevosLikes;
    setVideos(nuevosVideos);

    await supabase.from('videos_showcase').update({ likes: nuevosLikes }).eq('id', id);

    // 🔥 NOTIFICACIÓN DE LIKE AL CREADOR
    if (video.id_usuario !== usuario.id) {
       await supabase.from('notificaciones').insert([{
         id_usuario: video.id_usuario,
         mensaje: `❤️ A alguien le ha gustado tu vídeo del Showcase.`,
         tipo: 'like'
       }]);
    }
  };

  const abrirComentarios = async (id: string) => {
    setComentariosActivos(id);
    const { data } = await supabase.from('comentarios_showcase').select('*').eq('id_video', id).order('creado_el', { ascending: false });
    if (data) setListaComentarios(data);
  };

  const enviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !usuario || !comentariosActivos) return;

    const texto = nuevoComentario.trim();
    setNuevoComentario('');

    // Update optimistic
    setListaComentarios([{ id: Date.now(), texto, id_usuario: usuario.id, creado_el: new Date().toISOString() }, ...listaComentarios]);

    await supabase.from('comentarios_showcase').insert([{
      id_video: comentariosActivos,
      id_usuario: usuario.id,
      texto: texto
    }]);

    // 🔥 NOTIFICACIÓN DE COMENTARIO AL CREADOR
    const { data: videoData } = await supabase.from('videos_showcase').select('id_usuario').eq('id', comentariosActivos).single();
    if (videoData && videoData.id_usuario !== usuario.id) {
       await supabase.from('notificaciones').insert([{
          id_usuario: videoData.id_usuario,
          mensaje: `💬 Han comentado en tu Showcase: "${texto.substring(0, 30)}${texto.length > 30 ? '...' : ''}"`,
          tipo: 'comentario'
       }]);
    }
  };

  if (cargando) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden relative font-sans">
      
      {/* NAVEGACIÓN SUPERIOR FLOTANTE */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/" className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition">
          <span className="text-xl font-bold">←</span>
        </Link>
        <div className="flex items-center gap-6">
           <h1 className="text-sm font-black italic uppercase tracking-[0.3em] opacity-80">🔥 Showcase</h1>
           <button onClick={() => setMostrarModalSubida(true)} className="bg-white text-black px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest hover:scale-105 transition">
             + Subir
           </button>
        </div>
      </div>

      {/* CONTENEDOR DE VÍDEOS (Scroll Magnético) */}
      <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {videos.length === 0 ? (
          <div className="h-screen flex items-center justify-center flex-col text-center px-4">
             <span className="text-6xl mb-4">🎥</span>
             <h2 className="text-2xl font-black italic uppercase">No hay vídeos</h2>
             <p className="text-gray-400 text-sm mt-2 font-bold mb-8">Sube el primer look o drop a Vintage Lab.</p>
             <button onClick={() => setMostrarModalSubida(true)} className="bg-white text-black px-8 py-3 rounded-full font-black uppercase text-xs">Subir Vídeo</button>
          </div>
        ) : (
          videos.map((vid, index) => (
            <div key={vid.id} className="h-screen w-full snap-start snap-always relative overflow-hidden flex flex-col justify-end bg-zinc-900 border-b border-black">
              
              <video 
                ref={(el) => { videoRefs.current[index] = el; }}
                data-index={index}
                src={vid.video_url}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                controls={false}
                autoPlay={index === 0}
                muted={false}
                onClick={e => (e.target as HTMLVideoElement).paused ? (e.target as HTMLVideoElement).play() : (e.target as HTMLVideoElement).pause()}
              />
              
              {/* Gradiente Oscuro inferior para leer el texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none"></div>

              {/* Contenido (Textos y Botones de acción) */}
              <div className="relative z-10 p-6 pb-20 md:pb-12 flex items-end justify-between w-full h-full pointer-events-none">
                
                {/* Título y Auth */}
                <div className="flex-1 pr-16 animate-in slide-in-from-bottom-5 pointer-events-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="font-black text-xs">V</span>
                    </div>
                    <span className="font-bold text-sm tracking-widest uppercase drop-shadow-md">@Usuario_{vid.id_usuario.substring(0,4)}</span>
                  </div>
                  <p className="text-sm font-medium text-white drop-shadow-md max-w-sm line-clamp-3 mb-4 leading-relaxed">
                    {vid.descripcion}
                  </p>
                  
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 bg-black/50 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span>🎵</span> Sonido Original - Vintage Lab
                  </div>
                </div>

                {/* Sidebar Derecha (Botones de acción tipo TikTok) */}
                <div className="flex flex-col items-center gap-6 pb-4 animate-in slide-in-from-right-5 pointer-events-auto mt-auto mb-10">
                  
                  <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => darLike(vid.id, index)}>
                    <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-red-500 transition-colors">
                      <span className="text-2xl pt-1">❤️</span>
                    </div>
                    <span className="text-[11px] font-black">{vid.likes || 0}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => abrirComentarios(vid.id)}>
                    <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                      <span className="text-2xl pt-1">💬</span>
                    </div>
                    <span className="text-[11px] font-black">Comentar</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("¡Vídeo copiado al portapapeles!");
                  }}>
                    <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
                      <span className="text-2xl pt-1">↗️</span>
                    </div>
                    <span className="text-[11px] font-black">Share</span>
                  </div>
                  
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MENU INFERIOR MOBILE */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-black z-50 flex items-center justify-around md:hidden border-t border-zinc-900">
         <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Home</Link>
         <div className="text-[10px] font-black uppercase tracking-widest text-white">Showcase</div>
         <Link href="/comunidad" className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Outfits</Link>
      </div>

      {/* PANEL LATERAL DE COMENTARIOS */}
      {comentariosActivos && (
        <div className="absolute inset-0 bg-black/60 z-[60] flex justify-end animate-in fade-in transition-all">
          <div className="w-full max-w-sm h-full bg-zinc-900 shadow-2xl flex flex-col animate-in slide-in-from-right-10 duration-300 rounded-l-3xl border-l border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-black italic uppercase tracking-tighter text-xl">Comentarios</h3>
              <button onClick={() => setComentariosActivos(null)} className="w-8 h-8 bg-zinc-800 rounded-full flex justify-center items-center hover:bg-zinc-700">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {listaComentarios.length === 0 ? (
                <p className="text-zinc-500 text-xs font-bold text-center mt-10 uppercase tracking-widest">Sé el primero en comentar</p>
              ) : (
                listaComentarios.map((c, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold mb-1">Usuario_{c.id_usuario?.substring(0,4)}</p>
                      <p className="text-sm font-medium pr-4">{c.texto}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={enviarComentario} className="p-4 border-t border-zinc-800 flex gap-2">
              <input 
                type="text" 
                value={nuevoComentario}
                onChange={e => setNuevoComentario(e.target.value)}
                placeholder="Añadir comentario..." 
                className="flex-1 bg-zinc-800 rounded-full px-5 text-sm font-medium outline-none focus:bg-zinc-700 transition"
              />
              <button type="submit" className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition">
                <span className="font-black text-xl leading-none pt-1">↑</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUBIDA DE VÍDEO */}
      {mostrarModalSubida && (
        <div className="absolute inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95">
          <div className="max-w-md w-full bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 shadow-2xl relative">
            <button onClick={() => setMostrarModalSubida(false)} className="absolute top-6 right-6 w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:scale-110 transition">✕</button>
            
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 text-center text-white">Sube a Showcase 🎥</h2>
            
            <form onSubmit={subirVideo} className="space-y-6">
              <div className="border-2 border-dashed border-zinc-700 rounded-[2rem] h-64 flex items-center justify-center relative overflow-hidden group hover:border-blue-500 transition-colors bg-black">
                 {archivoVideo ? (
                   <div className="text-center p-6 z-10">
                     <span className="text-4xl block mb-2">✅</span>
                     <p className="text-xs font-bold text-green-400 max-w-xs break-words">{archivoVideo.name}</p>
                   </div>
                 ) : (
                   <div className="text-center p-6">
                      <span className="text-4xl mb-4 block animate-bounce">📱</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-500">Selecciona o arrastra tu clip</p>
                      <p className="text-[8px] font-bold text-zinc-600 mt-2">Formatos: MP4, MOV, WEBM (Max 15s recomendado)</p>
                   </div>
                 )}
                 <input type="file" required accept="video/*" onChange={(e) => setArchivoVideo(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-2">Descripción (Hashtags) #</label>
                <textarea 
                  required
                  placeholder="Ej: 🔥 Chequea este nuevo drop de Vintage Lab #streetwear #outfit" 
                  value={descripcionVideo}
                  onChange={(e) => setDescripcionVideo(e.target.value)}
                  className="w-full p-5 bg-black border border-zinc-800 rounded-3xl outline-none focus:border-blue-500 transition text-sm font-bold text-white resize-none"
                  rows={3}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={subiendo}
                className="w-full bg-white text-black p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-white/10 hover:scale-[1.02] transition active:scale-95 disabled:opacity-50"
              >
                {subiendo ? 'Subiendo Clip...' : 'Publicar Vídeo 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
