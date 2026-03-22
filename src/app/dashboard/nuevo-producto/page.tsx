'use client';

import { useState } from 'react';
import { supabase } from '@/bibliotecas/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoProducto() {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [talla, setTalla] = useState(''); // 🔥 NUEVO: Estado para la talla
  const [imagen, setImagen] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const manejarCambioImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagen(file);
      setVistaPrevia(URL.createObjectURL(file));
    }
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

      // 4. Insertar con los campos incluyendo TALLA
      const { error: insertError } = await supabase.from('productos').insert([{
        id_vendedor: vendedor.id,
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        descripcion: descripcion.trim(),
        categoria: categoria,
        talla: talla, // 🔥 NUEVO: Guardar talla en la DB
        imagen_url: urlImagenFinal
      }]);

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