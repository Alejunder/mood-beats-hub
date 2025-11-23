import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslatedMoods } from '../../utils/moodTranslations';
import './styles/EstadoAnimoTemplate.css';

export function EstadoAnimoTemplate() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [moodStats, setMoodStats] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Obtener moods con traducciones
  const moods = getTranslatedMoods(t);

  // Cargar estadísticas desde localStorage
  useEffect(() => {
    const loadStats = () => {
      const savedStats = localStorage.getItem('moodStats');
      if (savedStats) {
        setMoodStats(JSON.parse(savedStats));
      } else {
        // Datos iniciales de ejemplo
        const initialStats = {
          feliz: 15,
          triste: 2,
          motivado: 8,
          relajado: 10
        };
        setMoodStats(initialStats);
      }
    };

    loadStats();

    // Escuchar cambios en localStorage desde otras pestañas/componentes
    const handleStorageChange = (e) => {
      if (e.key === 'moodStats') {
        loadStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También verificar cambios cada segundo (para misma pestaña)
    const interval = setInterval(loadStats, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Detectar estado del sidebar
  useEffect(() => {
    const checkSidebar = () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        setSidebarOpen(sidebar.classList.contains('open'));
      }
    };

    checkSidebar();
    const interval = setInterval(checkSidebar, 100);

    return () => clearInterval(interval);
  }, []);

  // Calcular el máximo para las barras del gráfico
  const maxClicks = Math.max(...Object.values(moodStats), 1);

  // Obtener emociones ordenadas por clicks
  const sortedMoods = moods
    .map(mood => ({
      ...mood,
      clicks: moodStats[mood.id] || 0
    }))
    .sort((a, b) => b.clicks - a.clicks);

  return (
    <div className={`estado-animo-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="estado-animo-content">
        <div className="estado-animo-header">
          <h1>📊 {t('emotionStats')}</h1>
          <p>{t('emotionStatsSubtitle')}</p>
        </div>

      {/* Gráfico de estadísticas */}
      <div className="mood-stats-section">
        <div className="stats-header">
          <h2>{t('mostFrequent')}</h2>
        </div>
        <div className="stats-chart">
          {sortedMoods.map((mood, index) => (
            <div key={mood.id} className="stat-bar-container">
              <div className="stat-info">
                <span className="stat-rank">#{index + 1}</span>
                <span className="stat-emoji">{mood.emoji}</span>
                <span className="stat-label">{mood.label}</span>
              </div>
              <div className="stat-bar-wrapper">
                <div 
                  className="stat-bar"
                  style={{ 
                    width: `${mood.clicks > 0 ? (mood.clicks / maxClicks) * 100 : 5}%`,
                    backgroundColor: mood.color
                  }}
                >
                  <span className="state-value">{mood.clicks}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {Object.keys(moodStats).length > 0 && (
          <div className="stats-total">
            <p>{t('totalSelections')}: <strong>{Object.values(moodStats).reduce((a, b) => a + b, 0)}</strong></p>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mood-info-section">
        <h3>💡 {t('didYouKnow')}</h3>
        <div className="info-cards">
          <div className="info-card">
            <span className="info-icon">🎵</span>
            <p>{t('musicInfluence')}</p>
          </div>
          <div className="info-card">
            <span className="info-icon">📈</span>
            <p>{t('emotionTracking')}</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🎯</span>
            <p>{t('emotionLink')}</p>
          </div>
        </div>
      </div>

      <div className="action-section">
        <button className="primary-action-btn" onClick={() => navigate('/')}>
          {t('selectAnother')}
        </button>
      </div>
      </div>
    </div>
  );
}
