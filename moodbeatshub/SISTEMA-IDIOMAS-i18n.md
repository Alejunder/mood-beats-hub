# 🌍 Sistema de Internacionalización (i18n)

## ✅ Implementación Completa

He implementado un sistema completo de internacionalización para tu aplicación MoodBeatsHub.

## 📁 Estructura de Archivos

```
src/
├── i18n/
│   ├── locales/
│   │   ├── es.js    # Español
│   │   ├── en.js    # English
│   │   ├── pt.js    # Português
│   │   └── fr.js    # Français
│   └── index.js     # Exportaciones y configuración
├── context/
│   └── LanguageContext.jsx  # Contexto de idioma
└── App.jsx          # Ya configurado con LanguageProvider
```

## 🎯 Características

- ✅ **4 idiomas soportados**: Español, English, Português, Français
- ✅ **Detección automática**: Detecta el idioma del navegador al primer uso
- ✅ **Persistencia**: Guarda la preferencia en localStorage
- ✅ **Cambio en tiempo real**: Los textos cambian inmediatamente
- ✅ **Fácil de usar**: Hook `useLanguage()` simple

## 🚀 Cómo Usar en Cualquier Componente

### 1. Importar el hook

```javascript
import { useLanguage } from '../../context/LanguageContext';
```

### 2. Usar en el componente

```javascript
export function MiComponente() {
  const { t, language, changeLanguage } = useLanguage();

  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
      <button onClick={() => changeLanguage('en')}>
        English
      </button>
    </div>
  );
}
```

## 📝 API del Hook

### `useLanguage()`

Retorna un objeto con:

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `t(key)` | function | Función para traducir textos |
| `language` | string | Idioma actual ('es', 'en', 'pt', 'fr') |
| `changeLanguage(lang)` | function | Cambiar idioma |

## 🔤 Claves de Traducción Disponibles

### Navegación (`nav.*`)
```javascript
t('nav.home')        // Inicio / Home / Início / Accueil
t('nav.profile')     // Perfil / Profile / Perfil / Profil
t('nav.playlists')   // Playlists
t('nav.config')      // Configuración / Settings / Configurações / Paramètres
t('nav.mood')        // Estado de Ánimo / Mood / Humor / Humeur
```

### Home (`home.*`)
```javascript
t('home.title')         // Escucha tu música favorita
t('home.subtitle')      // ¿Cómo te sientes hoy?
t('home.logout')        // Cerrar sesión / Logout / Sair / Déconnexion
t('home.createPlaylist') // Personalizar Playlist
t('home.description')   // Haz tu playlist personalizada
```

### Perfil (`profile.*`)
```javascript
t('profile.title')            // Mi Perfil
t('profile.subtitle')         // Tu información y estadísticas
t('profile.accountInfo')      // Información de Cuenta
t('profile.user')             // Usuario
t('profile.email')            // Email
t('profile.accountType')      // Tipo de Cuenta
t('profile.country')          // País
t('profile.stats')            // Tus Estadísticas
t('profile.playlistsCreated') // Playlists Creadas
t('profile.totalPlaylists')   // Total Playlists
t('profile.favoriteGenre')    // Género Favorito
t('profile.followers')        // Seguidores
t('profile.inMoodBeatsHub')   // En MoodBeatsHub
t('profile.inSpotify')        // En Spotify
t('profile.mostListened')     // Más escuchado
t('profile.spotifyConnection') // Conexión con Spotify
t('profile.connected')        // Conectado
t('profile.connectedSubtitle') // Tu cuenta de Spotify está vinculada
t('profile.dangerZone')       // Zona de Peligro
t('profile.deleteAccount')    // Eliminar Cuenta
t('profile.deleteWarning')    // Eliminar tu cuenta de MoodBeatsHub...
t('profile.deleteNote')       // Esta acción no se puede deshacer...
t('profile.deleting')         // Eliminando...
t('profile.myPlaylists')      // Mis Playlists
t('profile.configuration')    // Configuración
t('profile.backToHome')       // Volver al Inicio
t('profile.loading')          // Cargando perfil...
t('profile.notAvailable')     // No disponible
```

### Configuración (`config.*`)
```javascript
t('config.title')            // Configuración / Settings
t('config.subtitle')         // Ajusta tu experiencia
t('config.playback')         // Reproducción
t('config.autoPlay')         // Reproducción automática
t('config.autoPlayDesc')     // Reproduce playlists automáticamente
t('config.quality')          // Calidad de audio
t('config.qualityDesc')      // Preferencia de calidad
t('config.qualityLow')       // Baja
t('config.qualityNormal')    // Normal
t('config.qualityHigh')      // Alta
t('config.qualityVeryHigh')  // Muy alta
t('config.content')          // Contenido
t('config.explicitContent')  // Contenido explícito
t('config.explicitDesc')     // Permitir canciones con lenguaje explícito
t('config.notifications')    // Notificaciones
t('config.notificationsDesc') // Recibir notificaciones
t('config.language')         // Idioma y Región
t('config.languageLabel')    // Idioma
t('config.languageDesc')     // Idioma de la aplicación
t('config.saveChanges')      // Guardar Cambios
t('config.back')             // Volver
t('config.viewProfile')      // Ver Mi Perfil
t('config.saved')            // Configuración guardada exitosamente
```

### Playlists (`playlists.*`)
```javascript
t('playlists.title')        // Playlists Favoritas
t('playlists.subtitle')     // Tus playlists guardadas
t('playlists.createNew')    // Crear Nueva Playlist
t('playlists.loading')      // Cargando tus playlists...
t('playlists.error')        // Error al cargar playlists
t('playlists.retry')        // Reintentar
t('playlists.songs')        // canciones
t('playlists.saved')        // Guardada
t('playlists.play')         // Player
t('playlists.spotify')      // Spotify
t('playlists.delete')       // Eliminar
t('playlists.deleting')     // Eliminando...
t('playlists.loadingPlayer') // Cargando...
t('playlists.empty')        // No tienes playlists favoritas
t('playlists.emptyDesc')    // Crea y guarda tus primeras playlists
t('playlists.createFirst')  // Crear Mi Primera Playlist
```

### Login (`login.*`)
```javascript
t('login.title')        // MoodBeatsHub
t('login.subtitle')     // Música que entiende tu estado de ánimo
t('login.welcome')      // Bienvenido
t('login.description')  // Conecta tu cuenta de Spotify...
t('login.loginButton')  // Iniciar sesión con Spotify
t('login.terms')        // Al iniciar sesión, aceptas...
t('login.error')        // Error al conectar con Spotify
```

### Común (`common.*`)
```javascript
t('common.loading')   // Cargando...
t('common.error')     // Error
t('common.success')   // Éxito
t('common.cancel')    // Cancelar
t('common.confirm')   // Confirmar
t('common.save')      // Guardar
t('common.delete')    // Eliminar
t('common.edit')      // Editar
t('common.close')     // Cerrar
t('common.yes')       // Sí
t('common.no')        // No
```

## 📝 Ejemplo Completo: Perfil con Traducciones

```javascript
import { useLanguage } from '../../context/LanguageContext';

export function PerfilTemplate() {
  const { t } = useLanguage();

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <h1>👤 {t('profile.title')}</h1>
        <p>{t('profile.subtitle')}</p>
      </div>

      <div className="perfil-section">
        <h2>📋 {t('profile.accountInfo')}</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-label">{t('profile.user')}</div>
            <div className="info-value">John Doe</div>
          </div>
          <div className="info-card">
            <div className="info-label">{t('profile.email')}</div>
            <div className="info-value">john@example.com</div>
          </div>
        </div>
      </div>

      <div className="perfil-section stats-section">
        <h2>📊 {t('profile.stats')}</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">15</div>
            <div className="stat-label">{t('profile.playlistsCreated')}</div>
            <div className="stat-sublabel">{t('profile.inMoodBeatsHub')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## ➕ Agregar Nuevas Traducciones

### 1. Edita los archivos de idioma

En `src/i18n/locales/es.js`:
```javascript
export const es = {
  // ... traducciones existentes ...
  newSection: {
    title: 'Nuevo Título',
    description: 'Nueva descripción'
  }
};
```

### 2. Repite para todos los idiomas

Edita `en.js`, `pt.js`, `fr.js` con las mismas claves.

### 3. Usa en tu componente

```javascript
t('newSection.title')        // → "Nuevo Título"
t('newSection.description')  // → "Nueva descripción"
```

## 🔄 Cómo Funciona el Cambio de Idioma

1. **Usuario selecciona idioma** en Configuración
2. `changeLanguage('en')` se ejecuta
3. El idioma se guarda en `localStorage`
4. El contexto se actualiza
5. **Todos los componentes se re-renderizan** con el nuevo idioma
6. Los textos cambian instantáneamente

## 💾 Persistencia

El idioma se guarda automáticamente en:
- **localStorage** → `'appLanguage'`
- Se carga automáticamente al iniciar la app
- Si no hay idioma guardado, detecta el idioma del navegador
- Fallback a español si no se detecta

## 🌐 Detección Automática del Navegador

Al primer uso, la app detecta automáticamente:

```javascript
const browserLang = navigator.language.split('-')[0];
// 'es-ES' → 'es'
// 'en-US' → 'en'
// 'pt-BR' → 'pt'
// 'fr-FR' → 'fr'
```

## 🎯 Componentes Ya Configurados

- ✅ **ConfiguracionTemplate** - Selector de idioma funcional
- ✅ **App.jsx** - LanguageProvider envolviendo toda la app

## 📌 Próximos Pasos para Traducir Más Componentes

Para traducir cualquier otro componente:

1. Importa el hook: `import { useLanguage } from '../../context/LanguageContext';`
2. Usa en el componente: `const { t } = useLanguage();`
3. Reemplaza textos: `"Inicio"` → `{t('nav.home')}`
4. ¡Listo!

## 🐛 Debugging

Si un texto no se traduce:
1. Verifica que la clave existe en todos los archivos de idioma
2. Usa console.log para ver qué retorna: `console.log(t('mi.clave'))`
3. Si retorna la clave, falta agregarla a los archivos de traducción

## 🎉 Resultado

Ahora tienes un sistema completo de internacionalización que:
- ✅ Soporta 4 idiomas
- ✅ Cambia en tiempo real
- ✅ Persiste la preferencia
- ✅ Detecta automáticamente el idioma del usuario
- ✅ Es fácil de extender

¡Puedes agregar traducciones a cualquier componente usando `t('clave')`!


