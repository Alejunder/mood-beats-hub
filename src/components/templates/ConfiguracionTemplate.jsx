import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Music, Bell, Globe, CheckCircle, CornerDownLeft, User, Star } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useAppSettings } from '../../hooks/useAppSettings';
import './styles/ConfiguracionTemplate.css';

export function ConfiguracionTemplate() {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const { settings, updateSetting, toggleSetting } = useSettings();
  const { showNotification: sendNotification } = useAppSettings();
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  // Sincronizar idioma con el contexto de configuración
  useEffect(() => {
    if (settings.language !== language) {
      updateSetting('language', language);
    }
  }, [language, settings.language, updateSetting]);

  const handleToggle = async (setting) => {
    // Si es el toggle de notificaciones, solicitar permisos primero
    if (setting === 'notifications') {
      if (!settings.notifications && 'Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            toggleSetting(setting);
            showNotification();
            // Mostrar notificación de prueba
            setTimeout(() => {
              sendNotification('🔔 ' + t('notificationsEnabled'), {
                body: t('notificationsEnabledDesc'),
                tag: 'notification-test'
              });
            }, 500);
          } else {
            return;
          }
        } catch (error) {
          console.error('Error solicitando permisos:', error);
          return;
        }
      } else if (settings.notifications) {
        // Desactivando notificaciones
        toggleSetting(setting);
        showNotification();
      } else if (!('Notification' in window)) {
        alert(t('notificationsNotSupported') || 'Tu navegador no soporta notificaciones');
        return;
      }
    } else {
      toggleSetting(setting);
      showNotification();
    }
  };

  const handleLanguageChange = (value) => {
    changeLanguage(value);
    updateSetting('language', value);
    showNotification();
  };

  const handleSelect = (setting, value) => {
    updateSetting(setting, value);
    showNotification();
  };

  const showNotification = () => {
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000);
  };

  return (
    <div className="configuracion-container">
      <div className="config-header">
        <h1><Settings size={64} style={{ display: 'inline', marginRight: '10px' }} /> </h1>
        <p>{t('adjustExperience')}</p>
      </div>

      {/* Sección de Idioma */}
      <div className="config-section">
        <h2><Globe size={24} style={{ display: 'inline', marginRight: '8px' }} /> {t('language')}</h2>
        <div className="config-settings-list">
          <div className="config-setting-item">
            <div className="config-setting-info">
              <label>{t('language')}</label>
              <p>{t('languageDesc')}</p>
            </div>
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="config-select-input"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇬🇧 English</option>
              <option value="pt">🇧🇷 Português</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notificación de guardado automático */}
      {showSaveNotification && (
        <div className="config-save-notification">
          <CheckCircle size={20} />
          <span>{t('autoSaved') || 'Guardado automáticamente'}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="config-actions">
        <button className="config-cancel-btn" onClick={() => navigate('/home')}>
          <CornerDownLeft size={20} />
          {t('back')}
        </button>
      </div>

      {/* Enlaces rápidos */}
      <div className="config-quick-actions">
        <button 
          className="config-action-btn primary"
          onClick={() => navigate('/perfil')}
        >
          <User size={20} />
          {t('viewProfile')}
        </button>
        <button 
          className="config-action-btn secondary"
          onClick={() => navigate('/playlists-favoritas')}
        >
          <Star size={20} />
          {t('myPlaylists')}
        </button>
      </div>
    </div>
  );
}
