import { useState } from 'react';
import './styles/ConfiguracionTemplate.css';

export function ConfiguracionTemplate() {
  const [settings, setSettings] = useState({
    notifications: true,
    autoPlay: false,
    explicitContent: true,
    darkMode: true,
    language: 'es',
    quality: 'high'
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSelect = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar la configuración
    console.log('Configuración guardada:', settings);
    alert('Configuración guardada exitosamente');
  };

  return (
    <div className="configuracion-container">
      <div className="configuracion-header">
        <h1>Configuración</h1>
        <p>Personaliza tu experiencia en MoodBeatsHub</p>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <h2>🔔 Notificaciones</h2>
          <div className="setting-item">
            <div className="setting-info">
              <label>Notificaciones push</label>
              <p>Recibe notificaciones sobre nuevas recomendaciones</p>
            </div>
            <button 
              className={`toggle-btn ${settings.notifications ? 'active' : ''}`}
              onClick={() => handleToggle('notifications')}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>🎵 Reproducción</h2>
          <div className="setting-item">
            <div className="setting-info">
              <label>Reproducción automática</label>
              <p>Reproduce automáticamente al seleccionar un estado de ánimo</p>
            </div>
            <button 
              className={`toggle-btn ${settings.autoPlay ? 'active' : ''}`}
              onClick={() => handleToggle('autoPlay')}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <label>Calidad de audio</label>
              <p>Selecciona la calidad de reproducción</p>
            </div>
            <select 
              value={settings.quality}
              onChange={(e) => handleSelect('quality', e.target.value)}
              className="select-input"
            >
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="very-high">Muy alta</option>
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h2>🔒 Contenido</h2>
          <div className="setting-item">
            <div className="setting-info">
              <label>Contenido explícito</label>
              <p>Permitir canciones con contenido explícito</p>
            </div>
            <button 
              className={`toggle-btn ${settings.explicitContent ? 'active' : ''}`}
              onClick={() => handleToggle('explicitContent')}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>🎨 Apariencia</h2>
          <div className="setting-item">
            <div className="setting-info">
              <label>Modo oscuro</label>
              <p>Usar tema oscuro en la aplicación</p>
            </div>
            <button 
              className={`toggle-btn ${settings.darkMode ? 'active' : ''}`}
              onClick={() => handleToggle('darkMode')}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <label>Idioma</label>
              <p>Selecciona el idioma de la aplicación</p>
            </div>
            <select 
              value={settings.language}
              onChange={(e) => handleSelect('language', e.target.value)}
              className="select-input"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </section>
      </div>

      <div className="settings-actions">
        <button className="save-btn" onClick={handleSave}>
          Guardar cambios
        </button>
        <button className="cancel-btn">
          Cancelar
        </button>
      </div>
    </div>
  );
}
