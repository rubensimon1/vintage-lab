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
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

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

      // 5. Insertar con los campos incluyendo TALLA, DESTACADO e IMÁGENES EXTRA
      const { error: insertError } = await supabase.from('productos').insert([{
        id_vendedor: vendedor.id,
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        descripcion: descripcion.trim(),
        categoria: categoria,
        talla: talla,
        imagen_url: urlImagenFinal,
        destacado: destacado,
        imagenes_extra: urlsExtra
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
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-black mb-4 flex items-center gap-1">
            ← Volver al panel
          </button>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black text-center">Nuevo Drop</h1>
        </header>
        
        <form onSubmit={subirProducto} className="space-y-6">
          {/* Área de Imagen */}
          <div className="group relative border-2 border-dashed border-gray-200 rounded-3xl h-64 flex items-center justify-center overflow-hidden bg-gray-50 transition hover:border-black">
            {vistaPrevia ? (
              <>
                <img src={vistaPrevia} className="w-full h-full object-cover" alt="Previsualización" />
                <button type="button" onClick={() => {setImagen(null); setVistaPrevia(null);}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full text-xs shadow-lg">Cambiar</button>
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
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Nombre del Drop</label>
              <input type="text" placeholder="Ej: Jordan 1 Retro High" required className="w-full p-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium" onChange={(e) => setNombre(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Precio */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Precio</label>
                <input type="number" placeholder="0.00" required step="0.01" className="w-full p-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium" onChange={(e) => setPrecio(e.target.value)} />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Categoría</label>
                <select 
                  required 
                  className="w-full p-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium appearance-none"
                  onChange={(e) => setCategoria(e.target.value)}
                  value={categoria}
                >
                  <option value="" disabled>Selecciona</option>
                  <option value="Sneakers">Sneakers</option>
                  <option value="Streetwear">Streetwear</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Vintage">Vintage</option>
                </select>
              </div>
            </div>

            {/* 🔥 NUEVO: Selector de Tallas */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Talla / Size</label>
              <select 
                required 
                className="w-full p-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium appearance-none"
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
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Descripción</label>
              <textarea 
                placeholder="Estado del producto, detalles, etc..." 
                rows={3}
                required
                className="w-full p-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black font-medium transition"
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            {/* IMÁGENES EXTRA PARA VERIFICACIÓN */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 tracking-widest">Fotos Extra (máx. 4 — verificación)</label>
              <input type="file" accept="image/*" multiple onChange={manejarImagenesExtra} className="w-full p-3 bg-gray-100 rounded-2xl text-sm font-medium" />
              {previewsExtra.length > 0 && (
                <div className="flex gap-3 mt-3">
                  {previewsExtra.map((p, i) => (
                    <img key={i} src={p} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200" />
                  ))}
                </div>
              )}
            </div>

            {/* TOGGLE DESTACADO */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div>
                <p className="text-xs font-black uppercase tracking-widest">🔥 Destacar producto</p>
                <p className="text-[10px] text-gray-400 font-medium">Aparece primero con badge HOT</p>
              </div>
              <button
                type="button"
                onClick={() => setDestacado(!destacado)}
                className={`w-14 h-8 rounded-full transition-colors ${destacado ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${destacado ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition shadow-xl disabled:opacity-50"
          >
            {cargando ? 'Publicando...' : 'Lanzar Drop'}
          </button>
        </form>
      </div>
    </div>
  );
}