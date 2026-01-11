import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getCurrentUser, signOut } from '../../services/authService';
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
      label: t('personalizePlaylist'), 
      description: t('personalizePlaylistDesc') 
    },
  ];

  useEffect(() => {
    // Obtener información del usuario
    getCurrentUser().then((result) => {
      if (result.success) {
        setUser(result.data);
      }
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
      const result = await signOut();
      if (result.success) {
        navigate('/login');
      }
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
            return (
              <button
                key={mood.id}
                className="dashboard-card"
                onClick={() => handleMoodSelect(mood.id)}
              >
                <div className="card-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="48"
                    height="48"
                  >
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                </div>
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
