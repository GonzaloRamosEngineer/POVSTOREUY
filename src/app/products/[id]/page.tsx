import { createClient } from '@supabase/supabase-js';

// Forzamos dinamismo
export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  console.log("--- DEBUG START ---");
  console.log("ID Solicitado:", id);
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL); // ¿Se imprime la URL o undefined?
  console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "EXISTE (Oculta)" : "NO EXISTE");

  // Intento de conexión directo y sucio para probar
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!sbUrl || !sbKey) {
    return <h1>❌ ERROR CRÍTICO: Faltan Variables de Entorno en Vercel</h1>;
  }

  const supabase = createClient(sbUrl, sbKey);

  // Consulta simple
  const { data, error } = await supabase
    .from('products')
    .select('id, name') // Solo traemos nombre e id para probar
    .eq('id', id)
    .single();

  if (error) {
    return (
      <div style={{ padding: 20, fontFamily: 'monospace' }}>
        <h1>❌ Error de Supabase</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  if (!data) {
    return <h1>⚠️ Producto no encontrado en la DB (Data is null)</h1>;
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', background: '#f0f0f0' }}>
      <h1>✅ ¡ÉXITO! Conexión Establecida</h1>
      <p>Si ves esto, la base de datos y Vercel funcionan.</p>
      <ul>
        <li><strong>ID:</strong> {data.id}</li>
        <li><strong>Nombre:</strong> {data.name}</li>
      </ul>
      <p>Ahora sabemos que el problema estaba en generateMetadata o en los componentes.</p>
    </div>
  );
}