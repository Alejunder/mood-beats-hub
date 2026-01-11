import { supabase } from '../supabase/supabase.config';

/**
 * 🔐 AUTH SERVICE - FACADE
 * 
 * Servicio centralizado para operaciones de autenticación con Supabase.
 * Siguiendo el patrón Facade: ningún componente debe llamar directamente a supabase.auth
 * 
 * PRINCIPIOS:
 * - Una función = una responsabilidad
 * - Errores explícitos y semánticos
 * - No exponer detalles internos de Supabase al frontend
 * - Todas las operaciones con try/catch obligatorio
 */

/**
 * Obtiene el usuario autenticado actual
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Error obteniendo usuario actual:', error);
      return { success: false, error: error.message };
    }

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('❌ Error inesperado obteniendo usuario:', error);
    return { success: false, error: 'Error interno al obtener usuario' };
  }
};

/**
 * Obtiene la sesión actual del usuario
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error obteniendo sesión:', error);
      return { success: false, error: error.message };
    }

    if (!session) {
      return { success: false, error: 'No hay sesión activa' };
    }

    return { success: true, data: session };
  } catch (error) {
    console.error('❌ Error inesperado obteniendo sesión:', error);
    return { success: false, error: 'Error interno al obtener sesión' };
  }
};

/**
 * Refresca la sesión actual (obtiene nuevos tokens)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ Error refrescando sesión:', error);
      return { success: false, error: error.message };
    }

    if (!session) {
      return { success: false, error: 'No se pudo refrescar la sesión' };
    }

    return { success: true, data: session };
  } catch (error) {
    console.error('❌ Error inesperado refrescando sesión:', error);
    return { success: false, error: 'Error interno al refrescar sesión' };
  }
};

/**
 * Inicia sesión con OAuth (Spotify)
 * @param {Object} options - Opciones de OAuth
 * @param {string} options.provider - Proveedor OAuth (ej: 'spotify')
 * @param {string} options.redirectTo - URL de redirección
 * @param {Object} options.options - Opciones adicionales (state, etc.)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const signInWithOAuth = async ({ provider = 'spotify', redirectTo, options = {} }) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        ...options
      }
    });
    
    if (error) {
      console.error('❌ Error en OAuth:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Error inesperado en OAuth:', error);
    return { success: false, error: 'Error interno al iniciar sesión con OAuth' };
  }
};

/**
 * Cierra la sesión del usuario
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Error cerrando sesión:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error inesperado cerrando sesión:', error);
    return { success: false, error: 'Error interno al cerrar sesión' };
  }
};

/**
 * Suscribe a cambios en el estado de autenticación
 * @param {Function} callback - Función callback que recibe (event, session)
 * @returns {Object} Objeto con método unsubscribe
 */
export const onAuthStateChange = (callback) => {
  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  } catch (error) {
    console.error('❌ Error suscribiendo a cambios de auth:', error);
    return { unsubscribe: () => {} };
  }
};

/**
 * Obtiene el ID del usuario autenticado (helper rápido)
 * @returns {Promise<string|null>}
 */
export const getUserId = async () => {
  const result = await getCurrentUser();
  return result.success ? result.data.id : null;
};

/**
 * Verifica si hay un usuario autenticado
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  const result = await getCurrentSession();
  return result.success && result.data !== null;
};

// Exportación por defecto para importación directa
export default {
  getCurrentUser,
  getCurrentSession,
  refreshSession,
  signInWithOAuth,
  signOut,
  onAuthStateChange,
  getUserId,
  isAuthenticated
};
