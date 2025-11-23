import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import "./styles/Sidebar.css";

export function Sidebar() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);

  const LinksArray = [
    {
      label: t('home'),
      icon: "🏠",
      to: "/",
    },
    {
      label: t('mood'),
      icon: "😊",
      to: "/animo",
    },
    {
      label: t('playlists'),
      icon: "⭐",
      to: "/playlists-favoritas",
    },
  ];

  const SecondarylinksArray = [
    {
      label: t('config'),
      icon: "⚙️",
      to: "/configuracion",
    },
    { 
      label: t('profile'),
      icon: "👤",
      to: "/perfil",
    },
  ];

  return (
    <div className="sidebar-main">
      <button 
        className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('toggle')}
      >
        →
      </button>
      
      <nav className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-img">
            <span className="logo-icon">🎵</span>
          </div>
          {isOpen && <h2>MoodBeats</h2>}
        </div>

        {/* Primary Links */}
        <div className="sidebar-links">
          {LinksArray.map((link, index) => (
            <NavLink
              key={index}
              to={link.to}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <div className="link-icon">{link.icon}</div>
              {isOpen && <span className="link-label">{link.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-divider"></div>

        {/* Secondary Links */}
        <div className="sidebar-links">
          {SecondarylinksArray.map((link, index) => (
            <NavLink
              key={index}
              to={link.to}
              className={({ isActive }) => 
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <div className="link-icon">{link.icon}</div>
              {isOpen && <span className="link-label">{link.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-divider"></div>

        {/* Footer Card */}
        {isOpen && (
          <div className="sidebar-card">
            <p>{t('demo')}</p>
          </div>
        )}
      </nav>
    </div>
  );
}