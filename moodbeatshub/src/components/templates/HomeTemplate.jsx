import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase.config';
import { CircleLoader } from '../atoms/CircleLoader';
import './styles/HomeTemplate.css';

export function HomeTemplate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moodStats, setMoodStats] = useState({});

  const moods = [
    { id: 'feliz', emoji: '😊', label: 'Feliz', color: '#FFD93D', rgb: '255, 217, 61', description: 'Música alegre y optimista' },
    { id: 'triste', emoji: '😢', label: 'Triste', color: '#597081', rgb: '89, 112, 129', description: 'Melodías melancólicas' },
    { id: 'motivado', emoji: '💪', label: 'Motivado', color: '#9a031e', rgb: '154, 3, 30', description: 'Ritmos energéticos' },
    { id: 'relajado', emoji: '😌', label: 'Relajado', color: '#d5b9b2', rgb: '213, 185, 178', description: 'Sonidos tranquilos' }
  ];

  useEffect(() => {
    // Obtener información del usuario
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Cargar estadísticas desde localStorage
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
      localStorage.setItem('moodStats', JSON.stringify(initialStats));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleMoodSelect = (moodId) => {
    // Actualizar estadísticas
    const updatedStats = {
      ...moodStats,
      [moodId]: (moodStats[moodId] || 0) + 1
    };
    setMoodStats(updatedStats);
    localStorage.setItem('moodStats', JSON.stringify(updatedStats));
    
    // Navegar a la ruta correspondiente
    navigate(`/${moodId}`);
  };

  if (loading) {
    return (
      <div className="home-container">
        <CircleLoader />
      </div>
    );
  }

  return (
    <div className="home-container">
        <div className="header-content">
          <div className="user-info">
            <span className="user-name">
              {user?.user_metadata?.name || user?.email || 'Usuario'}
            </span>
            <button className="logout-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

      <main className="home-main">
        <div className="welcome-section">
          <h2>Escucha tu musica favorita</h2>
          <p>¿Cómo te sientes hoy? Selecciona tu estado de ánimo</p>
        </div>

        <div className="dashboard-grid">
          {moods.map((mood) => (
            <button
              key={mood.id}
              className="dashboard-card"
              onClick={() => handleMoodSelect(mood.id)}
              style={{ 
                '--mood-color': mood.color,
                '--mood-rgb': mood.rgb
              }}
            >
              <div className="card-icon">{mood.emoji}</div>
              <h3>{mood.label}</h3>
              <p className="card-description">{mood.description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
