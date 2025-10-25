import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./styles/Sidebar.css";
import { LinksArray, SecondarylinksArray } from "../../utils/StaticData";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

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
            <p>Demo</p>
          </div>
        )}
      </nav>
    </div>
  );
}