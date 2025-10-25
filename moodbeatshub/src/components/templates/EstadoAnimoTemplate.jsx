import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/EstadoAnimoTemplate.css';

export function EstadoAnimoTemplate() {
  const navigate = useNavigate();
  const [moodStats, setMoodStats] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const moods = [
    { id: 'feliz', emoji: '😊', label: 'Feliz', color: '#FFD93D' },
    { id: 'triste', emoji: '😢', label: 'Triste', color: '#597081' },
    { id: 'motivado', emoji: '💪', label: 'Motivado', color: '#9a031e' },
    { id: 'relajado', emoji: '😌', label: 'Relajado', color: '#d5b9b2' }
  ];

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
          <h1>📊 Estadísticas de tus Emociones</h1>
          <p>Visualiza cómo han evolucionado tus estados de ánimo</p>
        </div>

      {/* Gráfico de estadísticas */}
      <div className="mood-stats-section">
        <div className="stats-header">
          <h2>Tus Emociones Más Frecuentes</h2>
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
            <p>Total de selecciones: <strong>{Object.values(moodStats).reduce((a, b) => a + b, 0)}</strong></p>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mood-info-section">
        <h3>💡 ¿Sabías que?</h3>
        <div className="info-cards">
          <div className="info-card">
            <span className="info-icon">🎵</span>
            <p>La música influye directamente en tu estado de ánimo</p>
          </div>
          <div className="info-card">
            <span className="info-icon">📈</span>
            <p>Tracking de emociones te ayuda a conocerte mejor</p>
          </div>
          <div className="info-card">
            <span className="info-icon">🎯</span>
            <p>Cada emoción se vincula con playlists personalizadas</p>
          </div>
        </div>
      </div>

      <div className="action-section">
        <button className="primary-action-btn" onClick={() => navigate('/')}>
          Seleccionar otra emoción
        </button>
      </div>
      </div>
    </div>
  );
}
