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
            // Importante para iOS: asegurar que se detecte el hash fragment
            storageKey: 'supabase.auth.token',
            debug: true // Temporal para ver logs en iOS
        }
    }
)