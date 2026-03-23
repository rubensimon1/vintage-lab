'use client';

import { useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoProducto() {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [talla, setTalla] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [imagenesExtra, setImagenesExtra] = useState<File[]>([]);
  const [previewsExtra, setPreviewsExtra] = useState<string[]>([]);
  const [destacado, setDestacado] = useState(false);
  
  // 🔥 SUBASTAS Y RAFFLES
  const [esSubasta, setEsSubasta] = useState(false);
  const [horasSubasta, setHorasSubasta] = useState(24);

  const [esUpcoming, setEsUpcoming] = useState(false);
  const [fechaLanzamiento, setFechaLanzamiento] = useState("");

  const [cargando, setCargando] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const router = useRouter();

  const autocompletarConIA = async () => {
    if (!imagen) {
      alert('Sube una imagen primero para que la IA la analice.');
      return;
    }
    setGenerandoIA(true);
    try {
      // API Route simulada o real de Gemini Vision
      const response = await fetch('/api/ai-tagging');
      const data = await response.json();
      
      setNombre(data.nombre);
      setDescripcion(data.descripcion);
      setCategoria(data.categoria);
      setPrecio(data.precio);
      setTalla(data.talla);
    } catch (error) {
      console.error(error);
      alert('Error en el servicio de LlamaVision / OpenAI.');
    } finally {
      setGenerandoIA(false);
    }
  };

  const manejarCambioImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagen(file);
      setVistaPrevia(URL.createObjectURL(file));
    }
  };

  const manejarImagenesExtra = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    setImagenesExtra(files);
    setPreviewsExtra(files.map(f => URL.createObjectURL(f)));
  };

  const subirProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Inicia sesión primero");

      const { data: vendedor, error: errorVendedor } = await supabase
        .from('vendedores')
        .select('id')
        .eq('id_usuario', user.id)
        .single();

      if (errorVendedor || !vendedor) throw new Error("No se encontró tu perfil de vendedor");

      let urlImagenFinal = '';

      if (imagen) {
        const extension = imagen.name.split('.').pop();
        const nombreArchivo = `${Date.now()}.${extension}`;
        const rutaArchivo = `${vendedor.id}/${nombreArchivo}`;

        const { error: uploadError } = await supabase.storage
          .from('fotos') 
          .upload(rutaArchivo, imagen);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('fotos')
          .getPublicUrl(rutaArchivo);
        
        urlImagenFinal = publicUrl;
      }

      // 4. Subir imágenes extra
      const urlsExtra: string[] = [];
      for (const img of imagenesExtra) {
        const ext = img.name.split('.').pop();
        const nombreArc = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const rutaArc = `${vendedor.id}/${nombreArc}`;
        const { error: upErr } = await supabase.storage.from('fotos').upload(rutaArc, img);
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(rutaArc);
          urlsExtra.push(publicUrl);
        }
      }

      // 5. Insertar con los campos incluyendo SUBASTAS Y UPCOMING
      const endSubastaDate = esSubasta ? new Date(Date.now() + horasSubasta * 60 * 60 * 1000).toISOString() : null;
      const launchDate = esUpcoming && fechaLanzamiento ? new Date(fechaLanzamiento).toISOString() : null;
      
      const { error: insertError } = await supabase.from('productos').insert([{
        id_vendedor: vendedor.id,
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        descripcion: descripcion.trim(),
        categoria: categoria,
        talla: talla,
        imagen_url: urlImagenFinal,
        destacado: destacado,
        imagenes_extra: urlsExtra,
        es_subasta: esSubasta,
        fecha_fin_subasta: endSubastaDate,
        fecha_lanzamiento: launchDate,
        precio_inicial: esSubasta ? parseFloat(precio) : null
      }]);

      // 6. Insertar precio en historial
      if (!insertError) {
        const { data: prodInsertado } = await supabase.from('productos').select('id').eq('nombre', nombre.trim()).order('creado_el', { ascending: false }).limit(1).single();
        if (prodInsertado) {
          await supabase.from('historial_precios').insert([{ id_producto: prodInsertado.id, precio: parseFloat(precio) }]);
        }
      }

      if (insertError) throw insertError;

      alert("¡Producto publicado con éxito! 🚀");
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white p-8 transition-colors duration-500 font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <button onClick={() => router.back()} className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition flex items-center gap-1 font-bold">
            ← Volver al panel
          </button>
          <div className="opacity-50 hover:opacity-100 transition">
             {/* Un simple toggle visual de modo para testear */}
             <span className="text-xl">🌗</span>
          </div>
        </header>

        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-8 text-center bg-gradient-to-r from-black to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Nuevo Drop</h1>
        
        <form onSubmit={subirProducto} className="space-y-6">
          {/* Área de Imagen */}
          <div className="group relative border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl h-64 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-900/50 transition hover:border-black dark:hover:border-white">
            {vistaPrevia ? (
              <>
                <img src={vistaPrevia} className="w-full h-full object-cover" alt="Previsualización" />
                <button type="button" onClick={() => {setImagen(null); setVistaPrevia(null);}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full text-xs shadow-lg">Cambiar</button>
                <button 
                  type="button" 
                  onClick={autocompletarConIA} 
                  disabled={generandoIA}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition disabled:opacity-50"
                  title="La IA analizará la foto y rellenará el formulario por ti."
                >
                  <span className={`${generandoIA ? 'animate-spin' : ''}`}>✨</span> 
                  {generandoIA ? 'Analizando Joya...' : 'Autocompletar con IA'}
                </button>
              </>
            ) : (
              <div className="text-center p-6">
                <p className="text-gray-400 text-sm mb-2 font-medium">Pulsa para elegir una foto</p>
                <input type="file" accept="image/*" onChange={manejarCambioImagen} className="absolute inset-0 opacity-0 cursor-pointer" required />
                <span className="text-2xl">📸</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1 tracking-widest">Nombre del Drop</label>
              <input type="text" value={nombre} placeholder="Ej: Jordan 1 Retro High" required className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-bold text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 transition-all shadow-sm" onChange={(e) => setNombre(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Precio */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1 tracking-widest">Precio</label>
                <input type="number" value={precio} placeholder="0.00" required step="0.01" className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-bold text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 transition-all shadow-sm" onChange={(e) => setPrecio(e.target.value)} />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1 tracking-widest">Categoría</label>
                <select 
                  required 
                  className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-bold text-black dark:text-white appearance-none transition-all shadow-sm"
                  onChange={(e) => setCategoria(e.target.value)}
                  value={categoria}
                >
                  <option value="" disabled className="text-gray-400">Selecciona</option>
                  <option value="Sneakers">Sneakers</option>
                  <option value="Streetwear">Streetwear</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Vintage">Vintage</option>
                </select>
              </div>
            </div>

            {/* Tallas */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1 tracking-widest">Talla / Size</label>
              <select 
                required 
                className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-bold text-black dark:text-white appearance-none transition-all shadow-sm"
                onChange={(e) => setTalla(e.target.value)}
                value={talla}
              >
                <option value="" disabled>Selecciona Talla</option>
                <optgroup label="Sneakers (EU)">
                  {['38', '39', '40', '41', '42', '43', '44', '45', '46'].map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
                <optgroup label="Streetwear">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
                <option value="Única">Talla Única / Accesorio</option>
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1 tracking-widest">Descripción</label>
              <textarea 
                value={descripcion}
                placeholder="Estado del producto, detalles, etc..." 
                rows={4}
                required
                className="w-full p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white font-medium text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 transition-all shadow-sm resize-none"
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            {/* IMÁGENES EXTRA PARA VERIFICACIÓN */}
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1 tracking-widest">Fotos Extra (máx. 4 — verificación)</label>
              <input type="file" accept="image/*" multiple onChange={manejarImagenesExtra} className="w-full p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm" />
              {previewsExtra.length > 0 && (
                <div className="flex gap-3 mt-4">
                  {previewsExtra.map((p, i) => (
                    <img key={i} src={p} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 dark:border-zinc-700 shadow-md" />
                  ))}
                </div>
              )}
            </div>

            {/* TOGGLE DESTACADO */}
            <div className="flex items-center justify-between bg-orange-50/50 dark:bg-orange-950/20 p-5 rounded-3xl border border-orange-100 dark:border-orange-900/40">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-900 dark:text-orange-400">🔥 Destacar producto</p>
                <p className="text-[9px] text-orange-700/70 dark:text-orange-300/60 font-bold mt-1">Aparece primero con badge HOT</p>
              </div>
              <button
                type="button"
                onClick={() => setDestacado(!destacado)}
                className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${destacado ? 'bg-orange-500' : 'bg-gray-300 dark:bg-zinc-700'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${destacado ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* TOGGLE SUBASTA */}
            <div className="flex flex-col gap-4 bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-900 dark:text-blue-400">🔨 Lanzar como Subasta</p>
                  <p className="text-[9px] text-blue-700/70 dark:text-blue-300/60 font-bold mt-1">Permitir pujas durante x horas en directo.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEsSubasta(!esSubasta)}
                  className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${esSubasta ? 'bg-blue-600' : 'bg-blue-200 dark:bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${esSubasta ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              
              {esSubasta && (
                <div className="pt-2 border-t border-blue-100 mt-1 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">Duración:</span>
                  <select 
                    value={horasSubasta} 
                    onChange={(e) => setHorasSubasta(Number(e.target.value))}
                    className="flex-1 bg-white border border-blue-200 px-3 py-2 rounded-xl text-xs font-bold text-blue-900 outline-none"
                  >
                    <option value={12}>12 Horas</option>
                    <option value={24}>24 Horas</option>
                    <option value={48}>48 Horas</option>
                    <option value={72}>72 Horas</option>
                  </select>
                </div>
              )}
            </div>

            {/* TOGGLE UPCOMING / RAFFLE */}
            {!esSubasta && (
              <div className="flex flex-col gap-4 bg-purple-50/50 dark:bg-purple-900/20 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-900 dark:text-purple-400">🎟️ Raffle / Drop Calendar</p>
                    <p className="text-[9px] text-purple-700/70 dark:text-purple-300/60 font-bold mt-1">Lanzar en el futuro vía Sorteo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEsUpcoming(!esUpcoming)}
                    className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${esUpcoming ? 'bg-purple-600' : 'bg-purple-200 dark:bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${esUpcoming ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                {esUpcoming && (
                  <div className="pt-4 border-t border-purple-100 dark:border-purple-900/40 mt-1 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-900 dark:text-purple-400">Fecha y Hora de Cierre:</span>
                    <input 
                      type="datetime-local" 
                      required={esUpcoming}
                      value={fechaLanzamiento}
                      onChange={(e) => setFechaLanzamiento(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-purple-200 dark:border-purple-800 px-4 py-4 rounded-2xl text-sm font-bold text-purple-900 dark:text-purple-100 outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 mt-8"
          >
            {cargando ? 'Publicando Joya...' : 'Lanzar Drop al Mercado'}
          </button>
        </form>
      </div>
    </div>
  );
}