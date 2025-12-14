import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Music, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getTranslatedMoods } from '../../utils/moodTranslations';
import { moodStatsService } from '../../services/moodStatsService';
import './styles/EstadoAnimoTemplate.css';

export function EstadoAnimoTemplate() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [moodStats, setMoodStats] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener moods con traducciones
  const moods = getTranslatedMoods(t);

  // Cargar estadísticas desde Supabase
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const stats = await moodStatsService.getMoodStats();
        setMoodStats(stats);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        setMoodStats({});
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Recargar estadísticas cada 30 segundos para mantener datos actualizados
    const interval = setInterval(loadStats, 30000);

    return () => {
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
          <h1><BarChart3 size={64} style={{ display: 'inline', marginRight: '10px' }} /> </h1>
          <p>{t('emotionStatsSubtitle')}</p>
        </div>

      {/* Gráfico de estadísticas */}
      <div className="mood-stats-section">
        <div className="stats-header">
          <h2>{t('mostFrequent')}</h2>
        </div>
        {loading ? (
          <div className="stats-loading">
            <p>{t('loading') || 'Cargando...'}</p>
          </div>
        ) : (
          <>
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
            {Object.keys(moodStats).length > 0 ? (
              <div className="stats-total">
                <p>{t('totalSelections')}: <strong>{Object.values(moodStats).reduce((a, b) => a + b, 0)}</strong></p>
              </div>
            ) : (
              <div className="stats-empty">
                <p>{t('noPlaylists') || 'No hay playlists generadas aún. ¡Crea tu primera playlist!'}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Información adicional */}
      <div className="mood-info-section">
        <h3><Lightbulb size={24} style={{ display: 'inline', marginRight: '8px' }} /> {t('didYouKnow')}</h3>
        <div className="info-cards">
          <div className="info-card">
            <Music className="info-icon" size={32} />
            <p>{t('musicInfluence')}</p>
          </div>
          <div className="info-card">
            <TrendingUp className="info-icon" size={32} />
            <p>{t('emotionTracking')}</p>
          </div>
          <div className="info-card">
            <Target className="info-icon" size={32} />
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
