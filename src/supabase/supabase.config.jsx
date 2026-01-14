import {createClient} from "@supabase/supabase-js"

export const supabase = createClient(
    import.meta.env.VITE_APP_SUPABASE_URL,
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY,
    {
        auth: {
            storage: window.localStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true, // Detectar automáticamente callbacks OAuth
            flowType: 'pkce', // Usar flujo PKCE (más seguro)
            storageKey: 'supabase.auth.token',
            debug: true // Activar debug para ver qué está pasando
        }
    }
)

// Log inicial para debugging
console.log('🔧 Supabase client inicializado con detectSessionInUrl: true, flowType: pkce');

// Verificar configuración
if (!import.meta.env.VITE_APP_SUPABASE_URL || !import.meta.env.VITE_APP_SUPABASE_ANON_KEY) {
    console.error('❌ ERROR CRÍTICO: Variables de entorno de Supabase no configuradas');
    console.error('Verifica que .env contenga:');
    console.error('- VITE_APP_SUPABASE_URL');
    console.error('- VITE_APP_SUPABASE_ANON_KEY');
}