import { createClient } from '@supabase/supabase-js';

// Forzamos dinamismo absoluto
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // 1. Diagnóstico de Variables de Entorno
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!sbUrl || !sbKey) {
    return (
      <div style={{ padding: 40, fontFamily: 'monospace', color: 'red' }}>
        <h1>❌ ERROR CRÍTICO: VARIABLES FALTANTES</h1>
        <p>Vercel no está inyectando las variables.</p>
        <p>URL: {sbUrl ? 'OK' : 'MISSING'}</p>
        <p>KEY: {sbKey ? 'OK' : 'MISSING'}</p>
      </div>
    );
  }

  // 2. Intento de Conexión Directa
  const supabase = createClient(sbUrl, sbKey);

  console.log(`🔍 [DEBUG] Intentando buscar ID: ${id}`);

  // Hacemos la consulta más simple posible (sin joins complejos)
  const { data, error } = await supabase
    .from('products')
    .select('id, name, is_active')
    .eq('id', id); // Usamos .eq en lugar de .single() para evitar error si hay 0 filas

  // 3. Renderizado de Diagnóstico
  return (
    <div style={{ padding: 40, fontFamily: 'monospace', backgroundColor: '#f4f4f5', minHeight: '100vh', color: '#000' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>🛠️ MODO DIAGNÓSTICO VERCEL</h1>
      
      <div style={{ border: '1px solid #ccc', padding: '20px', background: 'white', borderRadius: '8px' }}>
        <p><strong>ID Solicitado:</strong> {id}</p>
        
        <hr style={{ margin: '20px 0' }} />

        {error ? (
          <div style={{ color: 'red' }}>
            <h3>❌ Error de Supabase:</h3>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        ) : (
          <div style={{ color: 'green' }}>
            <h3>✅ Conexión Exitosa</h3>
            <p><strong>Resultados encontrados:</strong> {data?.length}</p>
          </div>
        )}

        <hr style={{ margin: '20px 0' }} />

        <h3>Datos Crudos (Primer resultado):</h3>
        {data && data.length > 0 ? (
          <pre style={{ background: '#eee', padding: '10px' }}>
            {JSON.stringify(data[0], null, 2)}
          </pre>
        ) : (
          <p style={{ color: 'orange' }}>⚠️ El array de datos está vacío. El ID no devuelve resultados.</p>
        )}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Si ves esta pantalla, el enrutamiento de Next.js funciona bien. El problema estaba en generateMetadata o en los componentes hijos.</p>
      </div>
    </div>
  );
}