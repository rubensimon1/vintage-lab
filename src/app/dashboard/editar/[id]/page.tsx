'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/bibliotecas/supabase';
import Link from 'next/link';
import ThemeToggle from '@/componentes/ThemeToggle';

export default function EditarProducto() {
  const { id } = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [imagenUrl, setImagenUrl] = useState(''); 
  const [previsualizacion, setPrevisualizacion] = useState(''); 
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null); 

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    async function cargarProducto() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: producto, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !producto) {
        alert("Producto no encontrado.");
        router.push('/dashboard');
        return;
      }

      setNombre(producto.nombre);
      setPrecio(producto.precio.toString());
      setDescripcion(producto.descripcion || '');
      setCategoria(producto.categoria || '');
      setImagenUrl(producto.imagen_url || '');
      setPrevisualizacion(producto.imagen_url || '');
      setCargandoDatos(false);
    }
    cargarProducto();
  }, [id, router]);

  const manejarCambioImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivoImagen(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrevisualizacion(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const manejarActualizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActualizando(true);

    try {
      let urlFinalImagen = imagenUrl;

      // 1. SUBIR LA IMAGEN SI HA CAMBIADO (BUCKET: fotos)
      if (archivoImagen) {
        const extension = archivoImagen.name.split('.').pop();
        const nombreArchivo = `${Date.now()}.${extension}`;
        
        // Subimos al bucket "fotos"
        const { data: datosSubida, error: errorSubida } = await supabase.storage
          .from('fotos')
          .upload(nombreArchivo, archivoImagen);

        if (errorSubida) throw new Error("Error subiendo imagen: " + errorSubida.message);

        // Obtener la URL pública desde el bucket "fotos"
        const { data: datosUrl } = supabase.storage.from('fotos').getPublicUrl(nombreArchivo);
        urlFinalImagen = datosUrl.publicUrl;
      }

      // 2. ACTUALIZAR LOS DATOS EN LA TABLA
      const { error: errorUpdate } = await supabase
        .from('productos')
        .update({
          nombre,
          precio: parseFloat(precio),
          descripcion,
          categoria,
          imagen_url: urlFinalImagen,
        })
        .eq('id', id);

      if (errorUpdate) throw errorUpdate;

      alert("¡Producto actualizado correctamente! ✨");
      router.push('/dashboard');
      router.refresh();

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setActualizando(false);
    }
  };

  if (cargandoDatos) return (
    <div className="min-h-screen flex items-center justify-center dark:bg-[#070707]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#070707] text-black dark:text-white transition-colors duration-500">
      <header className="border-b border-gray-100 dark:border-zinc-900 bg-white/80 dark:bg-[#070707]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition">← Volver al Panel</Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3">Editor de Stock</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">Modificar Producto</h1>
        </div>

        <form onSubmit={manejarActualizacion} className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-1 space-y-6">
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Imagen del Drop</h3>
            
            <div 
              className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 border-4 border-dashed border-gray-100 dark:border-zinc-800 flex items-center justify-center group cursor-pointer shadow-inner"
              onClick={() => fileInputRef.current?.click()}
            >
              {previsualizacion ? (
                <>
                  <img src={previsualizacion} alt="Previsualización" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-3xl">📸</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <span className="text-5xl opacity-20">📸</span>
                  <p className="text-[9px] font-black uppercase text-gray-400">Click para subir foto</p>
                </div>
              )}
            </div>

            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={manejarCambioImagen} 
              className="hidden" 
            />

            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-center bg-gray-100 dark:bg-zinc-800 text-[10px] font-black py-4 rounded-full uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
            >
              {archivoImagen ? 'Cambiar Selección' : 'Seleccionar Foto'}
            </button>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-zinc-900/50 p-10 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-8">
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="NOMBRE DEL PRODUCTO" className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl text-[11px] font-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 uppercase tracking-widest outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition shadow-sm" required />
            
            <div className="grid grid-cols-2 gap-6">
              <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="PRECIO (€)" className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl text-[11px] font-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 uppercase tracking-widest outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition shadow-sm" required step="0.01" />
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl text-[11px] font-black text-black dark:text-white uppercase tracking-widest outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none transition shadow-sm" required>
                <option value="" disabled>CATEGORÍA</option>
                <option value="Sneakers">Sneakers</option>
                <option value="Streetwear">Streetwear</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Vintage">Vintage</option>
              </select>
            </div>

            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="DESCRIPCIÓN..." rows={5} className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 rounded-2xl text-[11px] font-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 uppercase tracking-widest outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition shadow-sm resize-none" />

            <button 
              type="submit" 
              disabled={actualizando}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-50"
            >
              {actualizando ? 'PROCESANDO...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}