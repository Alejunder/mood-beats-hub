import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import './styles/ConfiguracionTemplate.css';

export function ConfiguracionTemplate() {
  const navigate = useNavigate();
  const { language, changeLanguage, t } = useLanguage();
  const { settings, updateSetting, toggleSetting, resetSettings } = useSettings();
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  // Sincronizar idioma con el contexto de configuración
  useEffect(() => {
    if (settings.language !== language) {
      updateSetting('language', language);
    }
  }, [language]);

  const handleToggle = (setting) => {
    toggleSetting(setting);
    showNotification();
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

  const handleReset = () => {
    if (window.confirm(t('resetConfirm') || '¿Restablecer toda la configuración a valores predeterminados?')) {
      resetSettings();
      changeLanguage('es');
      alert(t('resetSuccess') || '✅ Configuración restablecida');
    }
  };

  return (
    <div className="configuracion-container">
      <div className="config-header">
        <h1>⚙️ {t('settings')}</h1>
        <p>{t('adjustExperience')}</p>
      </div>

      {/* Sección de Reproducción */}
      <div className="config-section">
        <h2>🎵 {t('playback')}</h2>
        <div className="config-settings-list">
          <div className="config-setting-item">
            <div className="config-setting-info">
              <label>{t('autoplay')}</label>
              <p>{t('autoplayDesc')}</p>
            </div>
            <button 
              className={`config-toggle-btn ${settings.autoPlay ? 'active' : ''}`}
              onClick={() => handleToggle('autoPlay')}
            >
              <span className="config-toggle-slider"></span>
            </button>
          </div>
          
          <div className="config-setting-item">
            <div className="config-setting-info">
              <label>{t('audioQuality')}</label>
              <p>{t('audioQualityDesc')}</p>
            </div>
            <select 
              value={settings.quality}
              onChange={(e) => handleSelect('quality', e.target.value)}
              className="config-select-input"
            >
              <option value="low">{t('low')}</option>
              <option value="normal">{t('normal')}</option>
              <option value="high">{t('high')}</option>
              <option value="very-high">{t('veryHigh')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sección de Contenido */}
      <div className="config-section">
        <h2>🔒 {t('content')}</h2>
        <div className="config-settings-list">
          <div className="config-setting-item">
            <div className="config-setting-info">
              <label>{t('explicitContent')}</label>
              <p>{t('explicitContentDesc')}</p>
            </div>
            <button 
              className={`config-toggle-btn ${settings.explicitContent ? 'active' : ''}`}
              onClick={() => handleToggle('explicitContent')}
            >
              <span className="config-toggle-slider"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Notificaciones */}
      <div className="config-section">
        <h2>🔔 {t('notifications')}</h2>
        <div className="config-settings-list">
          <div className="config-setting-item">
            <div className="config-setting-info">
              <label>{t('pushNotifications')}</label>
              <p>{t('pushNotificationsDesc')}</p>
            </div>
            <button 
              className={`config-toggle-btn ${settings.notifications ? 'active' : ''}`}
              onClick={() => handleToggle('notifications')}
            >
              <span className="config-toggle-slider"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Idioma */}
      <div className="config-section">
        <h2>🌍 {t('language')}</h2>
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
          <span>✅</span>
          <span>{t('autoSaved') || 'Guardado automáticamente'}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="config-actions">
        <button className="config-reset-btn" onClick={handleReset}>
          <span>🔄</span>
          {t('resetSettings') || 'Restablecer'}
        </button>
        <button className="config-cancel-btn" onClick={() => navigate('/home')}>
          <span>↩️</span>
          {t('back')}
        </button>
      </div>

      {/* Enlaces rápidos */}
      <div className="config-quick-actions">
        <button 
          className="config-action-btn primary"
          onClick={() => navigate('/perfil')}
        >
          <span>👤</span>
          {t('viewProfile')}
        </button>
        <button 
          className="config-action-btn secondary"
          onClick={() => navigate('/playlists-favoritas')}
        >
          <span>⭐</span>
          {t('myPlaylists')}
        </button>
      </div>
    </div>
  );
}
