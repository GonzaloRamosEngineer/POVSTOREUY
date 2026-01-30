import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 es el código cuando no se encuentra el registro
      console.error('Error checking subscriber:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar suscripción' },
        { status: 500 }
      );
    }

    // Si ya existe y está activo
    if (existingSubscriber && existingSubscriber.is_active) {
      return NextResponse.json(
        { message: 'Este email ya está suscrito', alreadySubscribed: true },
        { status: 200 }
      );
    }

    // Si existe pero fue dado de baja, reactivarlo
    if (existingSubscriber && !existingSubscriber.is_active) {
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: true,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        })
        .eq('id', existingSubscriber.id);

      if (updateError) {
        console.error('Error reactivating subscription:', updateError);
        return NextResponse.json(
          { error: 'Error al reactivar suscripción' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'Suscripción reactivada exitosamente', reactivated: true },
        { status: 200 }
      );
    }

    // Insertar nuevo suscriptor
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email: email.toLowerCase(),
          is_active: true,
        },
      ]);

    if (insertError) {
      console.error('Error inserting subscriber:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar suscripción' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Suscripción exitosa', success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error inesperado al procesar la suscripción' },
      { status: 500 }
    );
  }
}