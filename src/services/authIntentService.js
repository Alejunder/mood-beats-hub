import { supabase } from "../supabase/supabase.config";

/**
 * Servicio para manejar la validación de intents de autenticación (login vs signup)
 * Usa el backend de Supabase para validación robusta
 */

/**
 * Valida el intent del usuario actual después de que OAuth complete
 * @param {'login'|'signup'} intent - Intención del usuario
 * @param {number} flowStartedAtTimestamp - Timestamp de cuando se inició el flujo OAuth
 * @returns {Promise<{valid: boolean, error?: string, error_code?: string, should_logout?: boolean}>}
 */
export async function validateCurrentUserIntent(intent, flowStartedAtTimestamp) {
  try {
    // Convertir timestamp a ISO string para Postgres
    const flowStartedAt = new Date(flowStartedAtTimestamp).toISOString();

    console.log('🔍 Validando intent en backend:', {
      intent,
      flowStartedAt,
      timestamp: flowStartedAtTimestamp
    });

    // Llamar a la RPC con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const { data, error } = await supabase.rpc('validate_current_user_intent', {
        p_intent: intent,
        p_flow_started_at: flowStartedAt
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error('❌ Error validando intent:', error);
        // Si es un error de permisos o de función, permitir por seguridad
        return {
          valid: true,
          error: null,
          should_logout: false,
          fallback: true,
          debug: { original_error: error.message }
        };
      }

      console.log('📊 Resultado validación:', data);

      // Si data es null o undefined, permitir por compatibilidad
      if (!data) {
        console.warn('⚠️ No se recibió data de la validación, permitiendo acceso');
        return {
          valid: true,
          error: null,
          should_logout: false,
          fallback: true
        };
      }

      return {
        valid: data.valid,
        error: data.error,
        error_code: data.error_code,
        should_logout: data.should_logout || false,
        user_email: data.user_email,
        is_new_user: data.is_new_user,
        debug: data.debug
      };
    } catch (rpcError) {
      clearTimeout(timeoutId);
      throw rpcError;
    }
  } catch (error) {
    console.error('❌ Error en validateCurrentUserIntent:', error);
    
    // En caso de timeout o error, permitir continuar para no bloquear
    console.warn('⚠️ Permitiendo acceso por error en validación');
    return {
      valid: true,
      error: null,
      should_logout: false,
      fallback: true,
      debug: { error_message: error.message }
    };
  }
}

/**
 * Genera un timestamp del momento actual para marcar el inicio del flujo OAuth
 * @returns {number}
 */
export function generateFlowTimestamp() {
  return Date.now();
}

/**
 * Obtiene el email del usuario desde el token de acceso de Spotify
 * @param {string} accessToken - Token de acceso de Spotify
 * @returns {Promise<string|null>}
 */
export async function getSpotifyUserEmail(accessToken) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Spotify profile');
    }

    const profile = await response.json();
    return profile.email;
  } catch (error) {
    console.error('❌ Error obteniendo email de Spotify:', error);
    return null;
  }
}

