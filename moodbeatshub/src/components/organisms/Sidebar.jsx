import { useState } from "react";
import "./styles/Sidebar.css";

// Datos de ejemplo para los links del sidebar
const LinksArray = [
  { id: 1, label: "Spotify Music", to: "/" },
  { id: 2, label: "Estado de ánimo ", to: "/productos" },
  { id: 3, label: "Playlists favoritas", to: "/categorias" },
];

const SecondarylinksArray = [
  { id: 5, label: "Configuración", to: "/configuracion" },
  { id: 6, label: "Perfil", to: "/perfil" },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeLink, setActiveLink] = useState(1);

  const handleLinkClick = (id) => {
    setActiveLink(id);
  };

  return (
    <div className="sidebar-main">
      <button 
        className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
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
          {LinksArray.map((link) => (
            <div
              key={link.id}
              className={`sidebar-link ${activeLink === link.id ? 'active' : ''}`}
              onClick={() => handleLinkClick(link.id)}
            >
              <div className="link-icon">📊</div>
              {isOpen && <span className="link-label">{link.label}</span>}
            </div>
          ))}
        </div>

        <div className="sidebar-divider"></div>

        {/* Secondary Links */}
        <div className="sidebar-links">
          {SecondarylinksArray.map((link) => (
            <div
              key={link.id}
              className={`sidebar-link ${activeLink === link.id ? 'active' : ''}`}
              onClick={() => handleLinkClick(link.id)}
            >
              <div className="link-icon">⚙️</div>
              {isOpen && <span className="link-label">{link.label}</span>}
            </div>
          ))}
        </div>

        <div className="sidebar-divider"></div>

        {/* Footer Card */}
        {isOpen && (
          <div className="sidebar-card">
            <p>Demo</p>
          </div>
        )}
      </nav>
    </div>
  );
}