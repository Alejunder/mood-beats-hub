import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * Hook personalizado para aplicar configuraciones de la aplicación
 * en componentes específicos
 */
export function useAppSettings() {
  const { settings } = useSettings();

  // Aplicar configuraciones al reproductor de Spotify
  useEffect(() => {
    // Aquí puedes agregar lógica adicional que responda a cambios de configuración
  }, [settings]);

  /**
   * Verifica si el contenido explícito debe ser filtrado
   */
  const shouldFilterExplicitContent = () => {
    return !settings.explicitContent;
  };

  /**
   * Obtiene la calidad de audio configurada
   */
  const getAudioQuality = () => {
    return settings.quality || 'high';
  };

  /**
   * Verifica si el autoplay está habilitado
   */
  const isAutoPlayEnabled = () => {
    return settings.autoPlay || false;
  };

  /**
   * Verifica si las notificaciones están habilitadas
   */
  const areNotificationsEnabled = () => {
    return settings.notifications || false;
  };

  /**
   * Muestra una notificación si están habilitadas
   */
  const showNotification = (title, options = {}) => {
    if (areNotificationsEnabled() && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          icon: '/logo.png',
          badge: '/logo.png',
          ...options
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, {
              icon: '/logo.png',
              badge: '/logo.png',
              ...options
            });
          }
        });
      }
    }
  };

  return {
    settings,
    shouldFilterExplicitContent,
    getAudioQuality,
    isAutoPlayEnabled,
    areNotificationsEnabled,
    showNotification
  };
}

