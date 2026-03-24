# Vintage Lab | Marketplace Pro 🚀

**Vintage Lab** es una plataforma de próxima generación para el resell de artículos de lujo y streetwear. Diseñada para ofrecer una experiencia premium, rápida e intuitiva tanto para compradores como para vendedores de la cultura urbana.

## 🛠️ Stack Tecnológico

El proyecto utiliza las tecnologías más modernas para garantizar rendimiento y escalabilidad:

- **Framework**: [Next.js 16](https://nextjs.org) (App Router) con **React 19**.
- **Backend & Base de Datos**: [Supabase](https://supabase.com) (Postgres, Auth y Storage).
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com) con una arquitectura de diseño basada en variables CSS modernas.
- **Gestión de Pagos**: Integración con [Stripe](https://stripe.com) para transacciones seguras.
- **Visualización**: [Recharts](https://recharts.org) para métricas y análisis en tiempo real.
- **Utilidades de Exportación**: `html2canvas` y `jsPDF` para generación de facturas y reportes.
- **Tipado**: [TypeScript](https://www.typescriptlang.org) para un desarrollo robusto y seguro.

## ✨ Características Principales

- **Marketplace Dinámico**: Filtrado avanzado por categoría, talla y rango de precio.
- **Panel de Vendedor (Dashboard)**: Gestión completa de inventario y estadísticas de ventas.
- **Sistema de Favoritos**: Guarda tus artículos deseados para un acceso rápido.
- **Modo Oscuro/Claro**: Interfaz adaptable con transiciones suaves gracias a `next-themes`.
- **Feed Vertical (Showcase)**: Una forma moderna de descubrir productos tendencia.
- **Calendario de Drops**: Mantente al día con los últimos lanzamientos y raffles del mundillo.
- **Comunidad**: Espacio interactivo para compartir outfits y conectar con otros usuarios.

## 📂 Estructura del Proyecto

```text
src/
├── app/             # Rutas, páginas y lógica de servidor (Next.js App Router)
├── componentes/      # Componentes de UI reutilizables (Botones, Toggles, etc.)
├── bibliotecas/      # Configuraciones de clientes (Supabase, Providers)
└── tipos/           # Definiciones de interfaces y tipos Globales
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18.x o superior.
- Una cuenta en Supabase y Stripe.

### Instalación

1. Clona este repositorio:
   ```bash
   git clone [url-del-repositorio]
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura tus variables de entorno en un archivo `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_key
   STRIPE_SECRET_KEY=tu_stripe_secret
   ```

4. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

Abra [http://localhost:3000](http://localhost:3000) en su navegador para ver la aplicación en funcionamiento.

## 📈 Despliegue

La forma más sencilla de desplegar es usando la plataforma [Vercel](https://vercel.com). Simplemente conecta tu repositorio y configura las variables de entorno.

---
Desarrollado con ❤️ para la comunidad de coleccionistas y entusiastas del streetwear.
