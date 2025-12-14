import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Music } from 'lucide-react';
import { supabase } from '../../supabase/supabase.config';
import { useLanguage } from '../../context/LanguageContext';
import { CircleLoader } from '../atoms/CircleLoader';
import './styles/HomeTemplate.css';

export function HomeTemplate() {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moodStats, setMoodStats] = useState({});

  const moods = [
    { 
      id: 'genplaylist', 
      icon: Music, 
      label: t('personalizePlaylist'), 
      color: '#350911', 
      rgb: '154, 3, 30', 
      description: t('personalizePlaylistDesc') 
    },
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
              {user?.user_metadata?.name || user?.email || t('user')}
            </span>
            <button className="logout-button" onClick={handleLogout}>
              <LogOut size={18} style={{ marginRight: '0px' }} />
            </button>
          </div>
        </div>

      <main className="home-main">
        <div className="welcome-section">
          <h2>{t('welcomeTitle')}</h2>
          <p>{t('welcomeSubtitle')}</p>
        </div>

        <div className="dashboard-grid">
          {moods.map((mood) => {
            const IconComponent = mood.icon;
            return (
              <button
                key={mood.id}
                className="dashboard-card"
                onClick={() => handleMoodSelect(mood.id)}
                style={{ 
                  '--mood-color': mood.color,
                  '--mood-rgb': mood.rgb
                }}
              >
                <div className="card-icon"><IconComponent size={48} /></div>
                <h3>{mood.label}</h3>
                <p className="card-description">{mood.description}</p>
              </button>
            );
          })}
        </div>
      </main>

      {/* Selector de idioma flotante */}
      <div className="floating-language-selector">
        <select 
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="language-dropdown"
          aria-label={t('language')}
        >
          <option value="es">🇪🇸 Español</option>
          <option value="en">🇬🇧 English</option>
          <option value="pt">🇧🇷 Português</option>
          <option value="fr">🇫🇷 Français</option>
        </select>
      </div>
    </div>
  );
}
