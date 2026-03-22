/**
 * Define la estructura de un Vendedor en nuestra plataforma.
 * Usamos TypeScript para asegurar que nunca falte un dato importante.
 */
export interface Vendedor {
  id?: string;               // Generado por la base de datos
  id_usuario: string;        // Relación con la tabla de autenticación
  nombre_tienda: string;
  razon_registro: string;    // Respuesta a "¿Por qué quieres empezar?"
  metas: string;             // Respuesta a "¿Cuáles son tus metas?"
  comision_actual: number;   // Empezará en 15.0
  ventas_totales: number;    // Para el algoritmo de posicionamiento
  esta_verificado: boolean;  // Por si quieres aprobarlos manualmente primero
  creado_el?: string;
}