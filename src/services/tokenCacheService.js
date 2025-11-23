/**
 * 🚀 SERVICIO DE CACHING PARA TOKENS
 * 
 * Centraliza el caching de tokens de Spotify para evitar queries redundantes
 * Usado por todos los servicios que necesitan acceso a tokens
 */

class TokenCacheService {
  constructor() {
    this.cache = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      lastUpdate: 0
    };
  }

  /**
   * Guarda tokens en cache (memoria + sessionStorage)
   */
  set(accessToken, refreshToken, expiresAt) {
    this.cache = {
      accessToken,
      refreshToken,
      expiresAt,
      lastUpdate: Date.now()
    };

    // Persistir en sessionStorage
    try {
      sessionStorage.setItem('spotify_tokens_cache', JSON.stringify({
        accessToken,
        refreshToken,
        expiresAt,
        cached: Date.now()
      }));
    } catch (e) {
      console.warn('⚠️ No se pudo guardar en sessionStorage:', e);
    }
  }

  /**
   * Obtiene tokens del cache si son válidos
   * @returns {Object|null} Tokens si están válidos, null si expirados
   */
  get() {
    // Verificar cache en memoria
    const CACHE_VALIDITY = 5 * 60 * 1000; // 5 minutos
    
    if (this.cache.accessToken && (Date.now() - this.cache.lastUpdate) < CACHE_VALIDITY) {
      return {
        accessToken: this.cache.accessToken,
        refreshToken: this.cache.refreshToken,
        expiresAt: this.cache.expiresAt,
        fromCache: true
      };
    }

    // Intentar recuperar de sessionStorage
    try {
      const cached = sessionStorage.getItem('spotify_tokens_cache');
      if (cached) {
        const data = JSON.parse(cached);
        // Validar antigüedad (< 10 min)
        if (Date.now() - data.cached < 10 * 60 * 1000) {
          this.cache = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
            lastUpdate: data.cached
          };
          return { ...data, fromCache: true };
        }
      }
    } catch (e) {
      console.warn('⚠️ Error leyendo cache:', e);
    }

    return null;
  }

  /**
   * Verifica si los tokens están por expirar
   */
  isExpiringSoon(expiresAt) {
    if (!expiresAt) return true;
    
    const now = new Date();
    const expiration = new Date(expiresAt);
    const timeLeft = expiration - now;
    
    // Considerar "expirando pronto" si faltan < 5 minutos
    return timeLeft < 5 * 60 * 1000;
  }

  /**
   * Limpia el cache
   */
  clear() {
    this.cache = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      lastUpdate: 0
    };

    try {
      sessionStorage.removeItem('spotify_tokens_cache');
    } catch (e) {
      // Ignorar errores
    }
  }

  /**
   * Obtiene información de tiempo restante
   */
  getTimeLeft() {
    if (!this.cache.expiresAt) return null;
    
    const now = new Date();
    const expiration = new Date(this.cache.expiresAt);
    const timeLeft = expiration - now;
    
    return {
      milliseconds: timeLeft,
      minutes: Math.round(timeLeft / 1000 / 60),
      isValid: timeLeft > 0
    };
  }
}

// Exportar instancia única (singleton)
export const tokenCache = new TokenCacheService();



