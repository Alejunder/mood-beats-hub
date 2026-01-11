import { CircleLoader as Spinner } from 'react-spinners';
import { Dark } from '../../styles/themes';

export function CircleLoader({ size = 80, theme = Dark }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: theme.bg,
      zIndex: 9999
    }}>
      <Spinner color={theme.bg5} size={size} />
    </div>
  );
}