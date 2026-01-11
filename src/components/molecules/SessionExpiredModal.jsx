import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../../services/authService';
import './SessionExpiredModal.css';

export function SessionExpiredModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleRelogin = async () => {
    try {
      // Cerrar sesión de Supabase
      await signOut();
      
      // Limpiar cualquier dato en localStorage/sessionStorage
      sessionStorage.clear();
      
      if (onClose) onClose();
      
      // Redirigir a login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así redirigir
      navigate('/login', { replace: true });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="session-expired-overlay" onClick={handleRelogin}>
      <div className="session-expired-modal" onClick={(e) => e.stopPropagation()}>
        <div className="session-expired-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        
        <h2 className="session-expired-title">Sesión Expirada</h2>
        
        <p className="session-expired-message">
          Tu sesión con Spotify ha expirado. Por favor, inicia sesión nuevamente para continuar usando la aplicación.
        </p>

        <div className="session-expired-actions">
          <button 
            className="session-expired-button-primary" 
            onClick={handleRelogin}
          >
            Iniciar Sesión
          </button>
        </div>

        <p className="session-expired-note">
          Esto ayuda a mantener tu cuenta segura
        </p>
      </div>
    </div>
  );
}
