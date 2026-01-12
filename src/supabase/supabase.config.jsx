import {createClient} from "@supabase/supabase-js"

export const supabase = createClient(
    import.meta.env.VITE_APP_SUPABASE_URL,
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY,
    {
        auth: {
            storage: window.localStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
            storageKey: 'supabase.auth.token',
            // Configuración optimizada para callbacks OAuth
            debug: false // Solo activar en desarrollo si es necesario
        }
    }
)