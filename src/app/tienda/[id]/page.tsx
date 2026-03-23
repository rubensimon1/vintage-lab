'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function PerfilTienda() {
  const { id } = useParams();
  const [tienda, setTienda] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);
  const [armario, setArmario] = useState<any[]>([]);
  const [pestañaActual, setPestañaActual] = useState<'venta' | 'armario'>('venta');
  const [notaMedia, setNotaMedia] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [seguidores, setSeguidores] = useState(0);
  const [siguiendo, setSiguiendo] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  // --- MODO EDICIÓN ---
  const [isEditing, setIsEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editForm, setEditForm] = useState({ 
    nombre_tienda: '', 
    descripcion: '', 
    avatar_url: '', 
    banner_url: '',
    color_fondo: '#0a0a0a',
    layout_id: 1
  });

  const [subiendoImagen, setSubiendoImagen] = useState(false);

  useEffect(() => {
    async function cargarTienda() {
      if (!id) return;

      // 1. Cargar datos del vendedor
      const { data: datosVendedor } = await supabase
        .from('vendedores')
        .select('*')
        .eq('id', id)
        .single();

      if (datosVendedor) {
        setTienda(datosVendedor);

        // 2. Cargar sus productos ordenados por popularidad
        const { data: datosProductos } = await supabase
          .from('productos')
          .select('*')
          .eq('id_vendedor', id)
          .order('ventas_count', { ascending: false })
          .order('creado_el', { ascending: false });

        if (datosProductos) setProductos(datosProductos);

        // 3. 🔥 Cargar las Reseñas de este vendedor
        const { data: datosResenas } = await supabase
          .from('resenas')
          .select('*')
          .eq('id_vendedor', id)
          .order('creado_el', { ascending: false });

        if (datosResenas && datosResenas.length > 0) {
          setResenas(datosResenas);
          // Calculamos la nota media sumando todas las puntuaciones y dividiendo entre el total
          const suma = datosResenas.reduce((acc, curr) => acc + curr.puntuacion, 0);
          setNotaMedia(suma / datosResenas.length);
        }

        // 4. Seguidores
        const { count } = await supabase
          .from('seguidores')
          .select('*', { count: 'exact', head: true })
          .eq('id_vendedor', id);
        setSeguidores(count || 0);

        // 5. Cargar Armario Virtual
        const { data: datosArmario } = await supabase
          .from('armario_virtual')
          .select('*')
          .eq('id_usuario', datosVendedor.id_usuario)
          .order('creado_el', { ascending: false });
        if (datosArmario) setArmario(datosArmario);

        // 6. Check si el usuario actual sigue
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUsuarioId(user.id);
          const { data: yaSigue } = await supabase
            .from('seguidores')
            .select('id')
            .eq('id_seguidor', user.id)
            .eq('id_vendedor', id)
            .single();
          setSiguiendo(!!yaSigue);
        }
      }
      setCargando(false);
    }

    cargarTienda();
  }, [id]);

  const toggleSeguir = async () => {
    if (!usuarioId) return alert('Inicia sesión para seguir vendedores');
    if (siguiendo) {
      await supabase.from('seguidores').delete().eq('id_seguidor', usuarioId).eq('id_vendedor', id);
      setSiguiendo(false);
      setSeguidores(prev => prev - 1);
    } else {
      await supabase.from('seguidores').insert([{ id_seguidor: usuarioId, id_vendedor: id }]);
      setSiguiendo(true);
      setSeguidores(prev => prev + 1);
      if (tienda?.id_usuario) {
        await supabase.from('notificaciones').insert([{
          id_usuario: tienda.id_usuario,
          tipo: 'seguidor',
          titulo: 'Nuevo seguidor',
          mensaje: 'Alguien ha empezado a seguir tu tienda',
          enlace: `/tienda/${id}`
        }]);
      }
    }
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    const { error } = await supabase
      .from('vendedores')
      .update({
        nombre_tienda: editForm.nombre_tienda,
        descripcion: editForm.descripcion,
        avatar_url: editForm.avatar_url,
        banner_url: editForm.banner_url,
        color_fondo: editForm.color_fondo,
        layout_id: editForm.layout_id
      })
      .eq('id', id);

    if (error) {
      alert('Error al guardar el perfil. Asegúrate de haber ejecutado el SQL de las columnas color_fondo y layout_id.');
      console.error(error);
    } else {
      setTienda({ ...tienda, ...editForm });
      setIsEditing(false);
    }
    setGuardando(false);
  };

  const subirImagen = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'avatar' | 'banner') => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setSubiendoImagen(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${usuarioId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tienda_media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('tienda_media').getPublicUrl(filePath);
      
      if (tipo === 'avatar') {
        setEditForm({ ...editForm, avatar_url: data.publicUrl });
      } else {
        setEditForm({ ...editForm, banner_url: data.publicUrl });
      }
    } catch (error) {
      alert('Error subiendo imagen. ¿Has creado el bucket "tienda_media"?');
      console.error(error);
    } finally {
      setSubiendoImagen(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (!tienda) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] text-black dark:text-white">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-4">Tienda no encontrada</h1>
        <Link href="/" className="text-blue-600 font-bold uppercase tracking-widest text-xs hover:underline">Volver al inicio</Link>
      </div>
    );
  }

  const inicial = tienda.nombre_tienda ? tienda.nombre_tienda.charAt(0).toUpperCase() : 'V';
  
  // Usar los valores del editForm si estamos editando para previsualizarlos en vivo
  const currentLayoutId = isEditing ? editForm.layout_id : (tienda.layout_id || 1);
  const currentColor = isEditing ? editForm.color_fondo : (tienda.color_fondo || '#0a0a0a');
  const currentAvatar = isEditing ? editForm.avatar_url : tienda.avatar_url;
  const currentBanner = isEditing ? editForm.banner_url : tienda.banner_url;
  const currentDesc = isEditing ? editForm.descripcion : tienda.descripcion;
  const currentName = isEditing ? editForm.nombre_tienda : tienda.nombre_tienda;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-500 overflow-x-hidden pb-32">
      
      {/* NAVBAR */}
      <nav className="border-b border-gray-100 dark:border-zinc-900 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 w-full">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter uppercase italic flex-shrink-0 hover:opacity-70 transition">
            VINTAGE<span className="text-blue-600">.</span>LAB
          </Link>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
            <ThemeToggle />
            <Link href="/" className="flex-1 sm:flex-none text-center text-[10px] font-black bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-full uppercase tracking-widest hover:scale-105 transition">
              Explorar Todo
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO / BANNER DE LA TIENDA */}
        {currentLayoutId !== 3 && (
          <div 
            className={`relative flex items-end overflow-hidden group ${currentLayoutId === 2 ? 'h-[20vh] md:h-[25vh]' : 'h-[30vh] md:h-[40vh]'}`}
            style={{ backgroundColor: currentColor }}
          >
            {isEditing && (
              <label className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-sm">
                <span className="text-3xl mb-2 flex items-center gap-2">📷 <span className="text-sm font-black uppercase tracking-widest">{subiendoImagen ? 'Subiendo...' : 'Cambiar Banner'}</span></span>
                <input type="file" accept="image/*" onChange={(e) => subirImagen(e, 'banner')} className="hidden" />
              </label>
            )}
            
            {currentBanner ? (
              <img src={currentBanner} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90"></div>
          </div>
        )}

        {/* INFO DE LA TIENDA */}
        <div className={`max-w-7xl mx-auto px-6 relative z-10 mb-16 ${currentLayoutId !== 3 ? '-mt-16 md:-mt-24' : 'pt-12'}`}>
          <div className={`flex flex-col gap-6 w-full ${currentLayoutId === 1 ? 'items-center text-center md:items-end md:flex-row md:text-left' : currentLayoutId === 2 ? 'items-start text-left md:flex-row md:items-end' : 'items-center text-center justify-center flex-col'}`}>
            
            <div className={`relative group ${currentLayoutId === 3 ? 'mb-4' : ''}`}>
              {isEditing && (
                <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-sm">
                  <span className="text-sm font-black uppercase tracking-widest text-center">📷</span>
                  <input type="file" accept="image/*" onChange={(e) => subirImagen(e, 'avatar')} className="hidden" />
                </label>
              )}
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className={`rounded-full border-4 border-white dark:border-[#0a0a0a] shadow-2xl flex-shrink-0 object-cover ${currentLayoutId === 3 ? 'w-24 h-24 md:w-32 md:h-32' : 'w-32 h-32 md:w-48 md:h-48'}`} />
              ) : (
                <div className={`bg-white dark:bg-[#111] rounded-full border-4 border-white dark:border-[#0a0a0a] shadow-2xl flex items-center justify-center flex-shrink-0 ${currentLayoutId === 3 ? 'w-24 h-24 md:w-32 md:h-32' : 'w-32 h-32 md:w-48 md:h-48'}`}>
                  <span className={`${currentLayoutId === 3 ? 'text-4xl md:text-6xl' : 'text-6xl md:text-8xl'} font-black uppercase italic text-blue-600`}>{inicial}</span>
                </div>
              )}
            </div>

            <div className="mb-2 md:mb-6 flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                  Vendedor Verificado ✓
                </span>
                {resenas.length > 0 && (
                  <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-yellow-200 dark:border-yellow-900/50">
                    ⭐ {notaMedia.toFixed(1)} <span className="text-yellow-500/50">({resenas.length})</span>
                  </span>
                )}
                <span className="bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">
                  {seguidores} {seguidores === 1 ? 'seguidor' : 'seguidores'}
                </span>
              </div>
              <h1 className={`${currentLayoutId === 3 ? 'text-4xl md:text-5xl' : 'text-5xl md:text-7xl'} font-black tracking-tighter italic uppercase leading-none drop-shadow-lg`}>
                {currentName}
              </h1>
              {currentLayoutId !== 3 && (
                <p className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-[0.3em] mt-3">
                  {productos.length} Drops Activos en el mercado
                </p>
              )}
              {currentDesc && (
                <p className={`text-sm font-medium text-gray-400 mt-4 leading-relaxed ${currentLayoutId === 3 ? 'max-w-2xl mx-auto text-center' : 'max-w-lg'}`}>
                  {currentDesc}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mb-12">
          {/* BOTÓN SEGUIR / EDITAR FLOTANTE o INTEGRADO */}
          <div className={`flex gap-4 ${currentLayoutId === 3 ? 'justify-center border-b border-gray-100 dark:border-zinc-900 pb-8' : 'justify-start'}`}>
            {usuarioId === tienda.id_usuario ? (
              <button
                onClick={() => {
                  setEditForm({ 
                    nombre_tienda: tienda.nombre_tienda || '', 
                    descripcion: tienda.descripcion || '', 
                    avatar_url: tienda.avatar_url || '', 
                    banner_url: tienda.banner_url || '',
                    color_fondo: tienda.color_fondo || '#0a0a0a',
                    layout_id: tienda.layout_id || 1
                  });
                  setIsEditing(!isEditing);
                }}
                className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-orange-600 text-white shadow-xl shadow-orange-500/20 hover:scale-105"
              >
                ⚙️ {isEditing ? 'Cerrar sin guardar' : 'Store Builder'}
              </button>
            ) : (
              <button
                onClick={toggleSeguir}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  siguiendo 
                    ? 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20' 
                    : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:scale-105'
                }`}
              >
                {siguiendo ? '✓ Siguiendo' : '+ Seguir'}
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800 shadow-2xl shadow-black">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:items-center justify-between">
              
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Layout:</span>
                  <button onClick={() => setEditForm({...editForm, layout_id: 1})} className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest ${editForm.layout_id === 1 ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-zinc-800 dark:text-gray-300'}`}>1. Clásico</button>
                  <button onClick={() => setEditForm({...editForm, layout_id: 2})} className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest ${editForm.layout_id === 2 ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-zinc-800 dark:text-gray-300'}`}>2. Izquierda</button>
                  <button onClick={() => setEditForm({...editForm, layout_id: 3})} className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest ${editForm.layout_id === 3 ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-zinc-800 dark:text-gray-300'}`}>3. Limpio</button>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4 border-l pl-4 border-gray-200 dark:border-zinc-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color Fondo:</span>
                  <input type="color" value={editForm.color_fondo} onChange={e => setEditForm({...editForm, color_fondo: e.target.value})} className="w-8 h-8 rounded-full border-none outline-none overflow-hidden cursor-pointer" />
                </div>
              </div>

              <div className="flex gap-4 items-center w-full md:w-auto flex-shrink-0">
                <input type="text" placeholder="Nombre" value={editForm.nombre_tienda} onChange={e => setEditForm({...editForm, nombre_tienda: e.target.value})} className="bg-gray-100 dark:bg-black w-24 md:w-48 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 text-[10px] font-black uppercase" />
                <button onClick={guardarPerfil} disabled={guardando || subiendoImagen} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition shadow-lg shadow-orange-500/20 disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar y Publicar ✓'}
                </button>
              </div>

            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-4">
          
          {/* GRID DE PRODUCTOS O ARMARIO */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 border-b border-gray-100 dark:border-zinc-900 pb-6 gap-6">
            <div className="flex items-center gap-4 bg-gray-100 dark:bg-zinc-900 p-2 rounded-2xl">
              <button 
                onClick={() => setPestañaActual('venta')}
                className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${pestañaActual === 'venta' ? 'bg-white dark:bg-black shadow-lg text-black dark:text-white' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
              >
                🛒 En Venta
              </button>
              <button 
                onClick={() => setPestañaActual('armario')}
                className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${pestañaActual === 'armario' ? 'bg-white dark:bg-black shadow-lg text-purple-600' : 'text-gray-500 hover:text-purple-500'}`}
              >
                💎 Mi Armario
              </button>
            </div>
            {pestañaActual === 'armario' && armario.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/50 px-6 py-3 rounded-full flex items-center gap-3">
                <span className="text-[10px] uppercase font-black text-purple-600 tracking-widest">Valor Colección:</span>
                <span className="text-xl italic font-black text-purple-600">
                  {armario.reduce((avg, item) => avg + Number(item.valor_estimado), 0).toFixed(2)}€
                </span>
              </div>
            )}
          </div>

          {pestañaActual === 'venta' ? (
            productos.length === 0 ? (
              <div className="text-center py-32 border-2 border-dashed border-gray-100 dark:border-zinc-900 rounded-[3rem]">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Este vendedor no tiene artículos a la venta</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16 mb-24">
                {productos.map((prod) => (
                  <Link href={`/producto/${prod.id}`} key={prod.id} className="group block">
                    <div className="relative aspect-[4/5] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-[#f9f9f9] dark:bg-zinc-900 mb-4 md:mb-6 transition-all border border-gray-50 dark:border-zinc-900 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                      <img src={prod.imagen_url || '/placeholder.png'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={prod.nombre} />
                      <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5">
                        <span className="bg-white/90 dark:bg-black/80 dark:text-white backdrop-blur-xl px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl font-black text-[9px] md:text-xs shadow-xl tracking-tighter">
                          {prod.precio}€
                        </span>
                      </div>
                    </div>
                    <div className="px-1 md:px-2">
                      <h3 className="font-bold text-[10px] md:text-sm leading-tight uppercase italic tracking-tighter truncate group-hover:text-blue-600 transition-colors">
                        {prod.nombre}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            /* VISTA DE ARMARIO VIRTUAL */
            <div>
              {usuarioId === tienda.id_usuario && (
                <div className="mb-12 bg-purple-50 dark:bg-purple-900/10 border-2 border-dashed border-purple-200 dark:border-purple-900/40 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 justify-between">
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-purple-600 mb-2">Añadir joya al armario</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest max-w-sm">
                      Sube fotos de tus zapatillas o prendas de colección para mostrarlas en tu perfil, aunque no las vendas.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const nombre = prompt('¿Qué zapatilla/prenda vas a añadir al armario?');
                      if(!nombre) return;
                      const valor = prompt('¿Cuál es su valor estimado en el mercado actual? (en €)');
                      if(!valor) return;
                      
                      const upload = document.createElement('input');
                      upload.type = 'file';
                      upload.accept = 'image/*';
                      upload.onchange = async (e: any) => {
                        const file = e.target.files[0];
                        if(!file) return;
                        
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random()}.${fileExt}`;
                        const filePath = `${usuarioId}/${fileName}`;
                        
                        const { error: upErr } = await supabase.storage.from('fotos').upload(filePath, file);
                        if(upErr){ alert('Error subiendo foto.'); return; }
                        
                        const { data: uri } = supabase.storage.from('fotos').getPublicUrl(filePath);
                        
                        const { error: dbErr } = await supabase.from('armario_virtual').insert([{
                          id_usuario: usuarioId,
                          nombre_prenda: nombre,
                          valor_estimado: Number(valor),
                          imagen_url: uri.publicUrl
                        }]);
                        
                        if(dbErr){ alert('Error insertando en la BD.'); }
                        else {
                          alert('¡Añadido a tu armario! Refresca si quieres.');
                          window.location.reload();
                        }
                      };
                      upload.click();
                    }}
                    className="bg-purple-600 text-white px-8 py-4 flex-shrink-0 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition"
                  >
                    + Añadir Prenda
                  </button>
                </div>
              )}
              
              {armario.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-gray-100 dark:border-zinc-900 rounded-[3rem]">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">El armario virtual está vacío.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16 mb-24">
                  {armario.map((item) => (
                    <div key={item.id} className="group block cursor-default">
                      <div className="relative aspect-square rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-[#f9f9f9] dark:bg-zinc-900 mb-4 md:mb-6 transition-all border-4 border-white dark:border-black shadow-lg shadow-purple-900/10 group-hover:scale-105 group-hover:rotate-1">
                        <img src={item.imagen_url || '/placeholder.png'} className="w-full h-full object-cover" alt={item.nombre_prenda} />
                        <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                          Not For Sale 🚫
                        </div>
                      </div>
                      <div className="px-1 md:px-2 text-center">
                        <h3 className="font-bold text-[10px] md:text-sm leading-tight uppercase italic tracking-tighter truncate text-purple-600 mb-1">
                          {item.nombre_prenda}
                        </h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Valor Estimado: {item.valor_estimado}€</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🔥 SECCIÓN DE RESEÑAS */}
          {resenas.length > 0 && (
            <div className="border-t border-gray-100 dark:border-zinc-900 pt-16 pb-32">
              <div className="text-center mb-12">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">Feedback de la comunidad</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase">Valoraciones</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resenas.map((resena) => (
                  <div key={resena.id} className="bg-[#f9f9f9] dark:bg-[#111] p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all">
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-black text-sm italic uppercase">
                          {/* Inicial anónima del comprador */}
                          U
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">Comprador Verificado</p>
                          <p className="text-[8px] font-bold text-gray-400 tracking-widest">
                            {new Date(resena.creado_el).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-black px-3 py-1.5 rounded-full shadow-sm text-xs">
                        {'⭐'.repeat(resena.puntuacion)}
                      </div>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      "{resena.comentario}"
                    </p>
                    
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}