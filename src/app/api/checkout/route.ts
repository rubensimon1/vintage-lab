import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Inicializamos Stripe con tu clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any, // Usamos la versión estable
});

export async function POST(request: Request) {
  try {
    const { items, email, descuento, legitCheck } = await request.json();

    // 1. Transformamos los items de tu cesta al formato que exige Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.nombre,
          images: item.imagen ? [item.imagen] : [],
        },
        // Stripe trabaja en céntimos
        unit_amount: Math.round(item.precio * 100), 
      },
      quantity: 1, // En tu marketplace cada item es único
    }));

    if (legitCheck) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: '🔍 Autenticación Física Especializada (Legit Check)' },
          unit_amount: 399, // 3.99€
        },
        quantity: 1,
      });
    }

    // Detectamos la URL base de tu web
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // 2. Configuramos la sesión
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/pago-exito`,
      cancel_url: `${origin}/cesta`,
    };

    if (email) {
      sessionConfig.customer_email = email;
    }

    // 3. 🔥 ¡El truco maestro! Si hay un descuento válido, creamos un cupón de Stripe al vuelo
    if (descuento && descuento > 0) {
      const stripeCoupon = await stripe.coupons.create({
        percent_off: descuento,
        duration: 'once',
      });
      sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
    }

    // 4. Creamos la sesión de pago segura en los servidores de Stripe
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Devolvemos la URL generada por Stripe para redirigir al usuario
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error("Error en Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}