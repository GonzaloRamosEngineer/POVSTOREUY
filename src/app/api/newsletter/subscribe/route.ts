import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyRateLimit, getClientIp } from '@/lib/rateLimit/apply';
import { getNewsletterLimiters } from '@/lib/rateLimit/limiters';

// FORZAMOS DINÁMICO PARA EL BUILD
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { perMinute, perDay } = getNewsletterLimiters();
    const { blockedResponse } = await applyRateLimit(getClientIp(request), [perMinute, perDay]);
    if (blockedResponse) return blockedResponse;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuración de base de datos faltante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking subscriber:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar suscripción' },
        { status: 500 }
      );
    }

    if (existingSubscriber && existingSubscriber.is_active) {
      return NextResponse.json(
        { message: 'Este email ya está suscrito', alreadySubscribed: true },
        { status: 200 }
      );
    }

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