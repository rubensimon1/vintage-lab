import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Inicializamos Stripe con tu clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any, // Usamos la versión estable
});

export async function POST(request: Request) {
  try {
    const { items, email } = await request.json();

    // 1. Transformamos los items de tu cesta al formato que exige Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.nombre,
          images: item.imagen ? [item.imagen] : [],
        },
        // Stripe trabaja en céntimos, así que multiplicamos por 100
        unit_amount: Math.round(item.precio * 100), 
      },
      quantity: 1, // En tu marketplace cada item es único
    }));

    // Detectamos la URL base de tu web (localhost en tu PC, o tu dominio si lo subes a Vercel)
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // 2. Creamos la sesión de pago segura en los servidores de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      // ¿A dónde volvemos si paga bien o si cancela?
      success_url: `${origin}/pago-exito`,
      cancel_url: `${origin}/cesta`,
      customer_email: email, // Rellena el email automáticamente si el usuario está logueado
    });

    // Devolvemos la URL generada por Stripe para redirigir al usuario
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("Error en Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}