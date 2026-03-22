'use client'; // Indica que este componente tiene interacción del usuario

import React, { useState } from 'react';

export default function FormularioRegistro() {
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState({
    nombre_tienda: '',
    razon_registro: '',
    metas: ''
  });

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí conectaremos con la base de datos en el siguiente paso
    console.log("Datos enviados:", datos);
    alert("¡Registro enviado para revisión!");
  };

  return (
    <form onSubmit={manejarEnvio} className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Únete como Vendedor</h2>

      {paso === 1 && (
        <div className="space-y-4">
          <label className="block font-medium text-gray-700">¿Cómo se llamará tu tienda?</label>
          <input 
            type="text" 
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={datos.nombre_tienda}
            onChange={(e) => setDatos({...datos, nombre_tienda: e.target.value})}
          />
          <button 
            type="button" 
            onClick={() => setPaso(2)}
            className="w-full bg-black text-white p-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Siguiente
          </button>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-4">
          <label className="block font-medium text-gray-700">¿Por qué quieres empezar con nosotros?</label>
          <textarea 
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
            value={datos.razon_registro}
            onChange={(e) => setDatos({...datos, razon_registro: e.target.value})}
          />
          
          <label className="block font-medium text-gray-700">¿Cuáles son tus metas a corto plazo?</label>
          <textarea 
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
            value={datos.metas}
            onChange={(e) => setDatos({...datos, metas: e.target.value})}
          />

          <div className="flex gap-2">
            <button type="button" onClick={() => setPaso(1)} className="flex-1 text-gray-500 font-medium">Atrás</button>
            <button type="submit" className="flex-2 bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition px-6">
              Finalizar Registro
            </button>
          </div>
        </div>
      )}
    </form>
  );
}