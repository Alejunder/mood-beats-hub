import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Smile, Star, Settings, User, Music, ChevronRight, Menu, X } from 'lucide-react';
import { useLanguage } from "../../context/LanguageContext";
import "./styles/Sidebar.css";

export function Sidebar() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const LinksArray = [
    {
      label: t('home'),
      icon: Home,
      to: "/",
    },
    {
      label: t('mood'),
      icon: Smile,
      to: "/animo",
    },
    {
      label: t('playlists'),
      icon: Star,
      to: "/playlists-favoritas",
    },
  ];

  const SecondarylinksArray = [
    {
      label: t('config'),
      icon: Settings,
      to: "/configuracion",
    },
    { 
      label: t('profile'),
      icon: User,
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
        <ChevronRight size={20} className="toggle-icon-desktop" />
        {isOpen ? (
          <X size={20} className="toggle-icon-mobile" />
        ) : (
          <Menu size={20} className="toggle-icon-mobile" />
        )}
      </button>
      
      <nav className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-img">
            <Music className="logo-icon" size={28} />
          </div>
          {isOpen && <h2>MoodBeatsHub</h2>}
        </div>

        {/* Primary Links */}
        <div className="sidebar-links">
          {LinksArray.map((link, index) => {
            const IconComponent = link.icon;
            return (
              <NavLink
                key={index}
                to={link.to}
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <div className="link-icon"><IconComponent size={22} /></div>
                {isOpen && <span className="link-label">{link.label}</span>}
              </NavLink>
            );
          })}
        </div>

        <div className="sidebar-divider"></div>

        {/* Secondary Links */}
        <div className="sidebar-links">
          {SecondarylinksArray.map((link, index) => {
            const IconComponent = link.icon;
            return (
              <NavLink
                key={index}
                to={link.to}
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <div className="link-icon"><IconComponent size={22} /></div>
                {isOpen && <span className="link-label">{link.label}</span>}
              </NavLink>
            );
          })}
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