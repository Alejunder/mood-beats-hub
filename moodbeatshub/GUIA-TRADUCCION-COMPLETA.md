# 🌍 Guía de Traducción Completa de Todos los Componentes

## 📋 Lista de Archivos a Traducir

### ✅ Ya Traducidos
1. **ConfiguracionTemplate.jsx** - ✅ Completamente traducido

### 🔄 Pendientes de Traducción

#### 1. **HomeTemplate.jsx**
Textos a traducir:
- "Usuario" → `{t('home.user')}`
- "Cerrar sesión" → `{t('home.logout')}`
- "Escucha tu musica favorita" → `{t('home.title')}`
- "¿Cómo te sientes hoy? Selecciona tu estado de ánimo" → `{t('home.subtitle')}`
- "Personalizar Playlist" → `{t('home.createPlaylist')}`
- "Haz tu playlist personalizada a ti" → `{t('home.description')}`

#### 2. **LoginTemplate.jsx**
Textos a traducir:
- "MoodBeatsHub" → `{t('login.title')}`
- "Música que entiende tu estado de ánimo" → `{t('login.subtitle')}`
- "Bienvenido" → `{t('login.welcome')}`
- "Conecta tu cuenta de Spotify..." → `{t('login.description')}`
- "Iniciar sesión con Spotify" → `{t('login.loginButton')}`
- "Al iniciar sesión, aceptas..." → `{t('login.terms')}`
- "Error al conectar con Spotify..." → `{t('login.error')}`

#### 3. **PerfilTemplate.jsx**
Ya tiene todas las claves definidas en `profile.*`

#### 4. **PlaylistsTemplate.jsx**
Textos a traducir:
- "Cargando tus playlists favoritas..." → `{t('playlists.loading')}`
- "Error al cargar playlists" → `{t('playlists.error')}`
- "Reintentar" → `{t('playlists.retry')}`
- "Playlists Favoritas" → `{t('playlists.title')}`
- "Tus playlists guardadas y personalizadas" → `{t('playlists.subtitle')}`
- "Crear Nueva Playlist" → `{t('playlists.createNew')}`
- "canciones" → `{t('playlists.songs')}`
- "Guardada" → `{t('playlists.saved')}`
- "Player" → `{t('playlists.play')}`
- "Spotify" → `{t('playlists.spotify')}`
- "Eliminar" → `{t('playlists.delete')}`
- "Eliminando..." → `{t('playlists.deleting')}`
- "Cargando..." → `{t('playlists.loadingPlayer')}`
- "No tienes playlists favoritas aún" → `{t('playlists.empty')}`
- "Crea y guarda tus primeras playlists..." → `{t('playlists.emptyDesc')}`
- "Crear Mi Primera Playlist" → `{t('playlists.createFirst')}`

#### 5. **Sidebar.jsx**
Textos a traducir (en StaticData.jsx):
- Labels de navegación

## 📝 Cómo Traducir Cada Archivo

### Paso 1: Importar el hook

```javascript
import { useLanguage } from '../../context/LanguageContext';
```

### Paso 2: Usar en el componente

```javascript
export function MiComponente() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('seccion.clave')}</h1>
    </div>
  );
}
```

### Paso 3: Reemplazar textos estáticos

**Antes:**
```javascript
<button>Cerrar sesión</button>
```

**Después:**
```javascript
<button>{t('home.logout')}</button>
```

## 🚀 Traducciones Completas para Copiar

### Actualiza EN.JS (English):

```javascript
// Añade estas claves al archivo en.js

home: {
  user: 'User',
},

playlists: {
  playInPlayer: 'Play in player',
  openInSpotify: 'Open in Spotify',
  deletePlaylist: 'Delete playlist from Spotify and favorites',
  playerNotAvailable: 'Player not available',
  deleteConfirm: 'Delete "{name}"?\n\n⚠️ WARNING: This will PERMANENTLY delete the playlist from Spotify and your favorites.\n\nAre you sure?',
  deleteError: 'Error deleting playlist',
  customPlaylist: 'Custom playlist',
  errorUser: 'User not authenticated',
  errorLoadUser: 'Could not get user information',
  today: 'Today',
  yesterday: 'Yesterday',
  daysAgo: '{days} days ago',
  weeksAgo: '{weeks} weeks ago',
  unknown: 'Unknown'
},

login: {
  errorLogin: 'Error logging in'
},

sidebar: {
  home: 'Home',
  mood: 'Mood',
  playlists: 'Playlists',
  profile: 'Profile',
  config: 'Settings',
  demo: 'Demo'
}
```

### Actualiza PT.JS (Português):

```javascript
// Añade estas claves al archivo pt.js

home: {
  user: 'Usuário',
},

playlists: {
  playInPlayer: 'Reproduzir no player',
  openInSpotify: 'Abrir no Spotify',
  deletePlaylist: 'Excluir playlist do Spotify e favoritos',
  playerNotAvailable: 'Player não disponível',
  deleteConfirm: 'Excluir "{name}"?\n\n⚠️ ATENÇÃO: Isso excluirá PERMANENTEMENTE a playlist do Spotify e dos seus favoritos.\n\nTem certeza?',
  deleteError: 'Erro ao excluir playlist',
  customPlaylist: 'Playlist personalizada',
  errorUser: 'Usuário não autenticado',
  errorLoadUser: 'Não foi possível obter informações do usuário',
  today: 'Hoje',
  yesterday: 'Ontem',
  daysAgo: 'Há {days} dias',
  weeksAgo: 'Há {weeks} semanas',
  unknown: 'Desconhecido'
},

login: {
  errorLogin: 'Erro ao fazer login'
},

sidebar: {
  home: 'Início',
  mood: 'Humor',
  playlists: 'Playlists',
  profile: 'Perfil',
  config: 'Configurações',
  demo: 'Demo'
}
```

### Actualiza FR.JS (Français):

```javascript
// Añade estas claves al archivo fr.js

home: {
  user: 'Utilisateur',
},

playlists: {
  playInPlayer: 'Lire dans le lecteur',
  openInSpotify: 'Ouvrir dans Spotify',
  deletePlaylist: 'Supprimer la playlist de Spotify et des favoris',
  playerNotAvailable: 'Lecteur non disponible',
  deleteConfirm: 'Supprimer "{name}"?\n\n⚠️ ATTENTION: Cela supprimera DÉFINITIVEMENT la playlist de Spotify et de vos favoris.\n\nÊtes-vous sûr?',
  deleteError: 'Erreur lors de la suppression de la playlist',
  customPlaylist: 'Playlist personnalisée',
  errorUser: 'Utilisateur non authentifié',
  errorLoadUser: 'Impossible d\'obtenir les informations de l\'utilisateur',
  today: 'Aujourd\'hui',
  yesterday: 'Hier',
  daysAgo: 'Il y a {days} jours',
  weeksAgo: 'Il y a {weeks} semaines',
  unknown: 'Inconnu'
},

login: {
  errorLogin: 'Erreur de connexion'
},

sidebar: {
  home: 'Accueil',
  mood: 'Humeur',
  playlists: 'Playlists',
  profile: 'Profil',
  config: 'Paramètres',
  demo: 'Démo'
}
```

## 📦 Componentes Prioritarios a Traducir

1. **HomeTemplate.jsx** - Página principal
2. **LoginTemplate.jsx** - Primera impresión
3. **PlaylistsTemplate.jsx** - Funcionalidad principal
4. **PerfilTemplate.jsx** - Ya tiene estructura
5. **Sidebar.jsx** - Navegación constante

## 🎯 Ejemplo Completo: HomeTemplate.jsx

```javascript
import { useLanguage } from '../../context/LanguageContext';

export function HomeTemplate() {
  const { t } = useLanguage();
  
  const moods = [
    { 
      id: 'genplaylist', 
      emoji: '🎵', 
      label: t('home.createPlaylist'), 
      description: t('home.description')
    },
  ];

  return (
    <div className="home-container">
      <div className="header-content">
        <div className="user-info">
          <span className="user-name">
            {user?.user_metadata?.name || user?.email || t('home.user')}
          </span>
          <button onClick={handleLogout}>
            {t('home.logout')}
          </button>
        </div>
      </div>

      <main className="home-main">
        <div className="welcome-section">
          <h2>{t('home.title')}</h2>
          <p>{t('home.subtitle')}</p>
        </div>
        {/* ... resto del código ... */}
      </main>
    </div>
  );
}
```

## ✅ Checklist de Traducción

- [ ] Actualizar en.js con todas las claves nuevas
- [ ] Actualizar pt.js con todas las claves nuevas  
- [ ] Actualizar fr.js con todas las claves nuevas
- [ ] Traducir HomeTemplate.jsx
- [ ] Traducir LoginTemplate.jsx
- [ ] Traducir PlaylistsTemplate.jsx
- [ ] Traducir PerfilTemplate.jsx
- [ ] Traducir Sidebar.jsx
- [ ] Actualizar StaticData.jsx para sidebar
- [ ] Probar cambio de idioma en cada componente

## 🔧 Función Auxiliar para Fechas

Para las fechas dinámicas, crea esta función auxiliar:

```javascript
const formatDate = (dateString, t) => {
  if (!dateString) return t('playlists.unknown');
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return t('playlists.today');
  if (diffDays === 1) return t('playlists.yesterday');
  if (diffDays < 7) return t('playlists.daysAgo').replace('{days}', diffDays);
  if (diffDays < 30) return t('playlists.weeksAgo').replace('{weeks}', Math.floor(diffDays / 7));
  
  return date.toLocaleDateString(language, { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};
```

## 🎉 Resultado Final

Una vez completado, toda tu aplicación estará disponible en:
- 🇪🇸 Español
- 🇬🇧 English
- 🇧🇷 Português
- 🇫🇷 Français

¡Y el cambio de idioma será instantáneo en todos los componentes!


