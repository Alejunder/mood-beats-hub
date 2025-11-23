# 🎵 Visualizador de Canciones de Playlist

## ✅ Funcionalidad Implementada

### 🎯 **Objetivo:**
Permitir al usuario ver todas las canciones de una playlist en un modal elegante y funcional.

---

## 🎨 Características del Visualizador

### 1. **Modal Completo** 📊
```
┌─────────────────────────────────────────┐
│  [Cover]  Nombre de la Playlist      [✕]│
│           Descripción                    │
│           25 canciones                   │
├─────────────────────────────────────────┤
│  #  │ Título         │ Álbum │ Fecha │ ⏱️│
├─────────────────────────────────────────┤
│  1  │ Song Name      │ ...   │ ...   │..│
│  2  │ Another Song   │ ...   │ ...   │..│
│  3  │ Track Three    │ ...   │ ...   │..│
│  ...                                     │
├─────────────────────────────────────────┤
│  🎵 25 canciones ⏱️ 87 min   [🔗 Spotify]│
└─────────────────────────────────────────┘
```

---

### 2. **Información Mostrada** 📋

#### **Header de la Playlist:**
- ✅ Portada de la playlist (120x120px)
- ✅ Nombre de la playlist
- ✅ Descripción
- ✅ Número total de canciones

#### **Cada Canción Muestra:**
- ✅ **#** - Número de orden
- ✅ **Portada** - Imagen del álbum (40x40px)
- ✅ **Título** - Nombre de la canción
- ✅ **Artistas** - Lista de artistas
- ✅ **Álbum** - Nombre del álbum
- ✅ **Fecha** - Fecha en que se agregó
- ✅ **Duración** - Tiempo (formato mm:ss)
- ✅ **Botones** - Abrir en Spotify 🔗 + Eliminar 🗑️ (al hover)

#### **Footer:**
- ✅ Total de canciones
- ✅ Duración total en minutos
- ✅ Botón para abrir playlist en Spotify

---

### 3. **Interactividad** 🖱️

#### **Click en Canción:**
```javascript
onClick() → Abre la canción en Spotify
```

#### **Hover en Canción:**
```javascript
onHover() → Muestra botón 🔗
           → Cambia color de fondo
           → Resalta el número
```

#### **Botón Spotify (Footer):**
```javascript
onClick() → Abre playlist completa en Spotify
```

---

### 4. **Estados del Modal** 🔄

#### **Estado: Loading** ⏳
```
┌─────────────────────────┐
│  [Spinner Animado]     │
│  Cargando canciones... │
└─────────────────────────┘
```

#### **Estado: Error** ❌
```
┌─────────────────────────┐
│  ⚠️                     │
│  Error cargando canciones│
│  [Error message]       │
│  [🔄 Reintentar]       │
└─────────────────────────┘
```

#### **Estado: Vacío** 🎵
```
┌─────────────────────────┐
│  🎵                     │
│  No hay canciones      │
└─────────────────────────┘
```

#### **Estado: Éxito** ✅
```
Muestra lista completa de canciones
```

#### **Estado: Eliminando Canción** ⏳ **NUEVO**
```
Botón 🗑️ cambia a ⏳
Usuario no puede hacer más acciones
Espera respuesta de Spotify
Si éxito → Canción desaparece de la lista
Si error → Muestra alerta con el error
```

---

## 🎯 Ubicación del Botón

### En PlaylistsTemplate.jsx:

```
Cada tarjeta de playlist tiene:
┌─────────────────────────┐
│  [Portada]             │
│  Nombre de Playlist     │
│  Descripción           │
│  🎵 25 canciones        │
├─────────────────────────┤
│  [▶ Play] [🔗 Spotify] │
│  [🎵 Ver Canciones]    │ ← NUEVO
│  [➕ Agregar]          │
│  [🗑️ Eliminar]        │
└─────────────────────────┘
```

---

## 🔧 Implementación Técnica

### Componentes Creados:

#### 1. **PlaylistTracksModal.jsx**
```javascript
Props:
  - isOpen: boolean
  - onClose: function
  - playlist: object
  - spotifyAccessToken: string

Funciones:
  - loadTracks()        → Carga canciones desde Spotify API
  - formatDuration()    → Convierte ms a mm:ss
  - formatDate()        → Formatea fecha agregada
  - openInSpotify()     → Abre canción en Spotify
  - handleDeleteTrack() → Elimina canción de la playlist ⚠️ NUEVO

Estados:
  - tracks              → Array de canciones
  - loading             → Boolean
  - error               → String o null
  - deletingTrackUri    → String o null (URI de la canción eliminándose)
```

#### 2. **PlaylistTracksModal.css**
```css
Estilos:
  - Modal overlay con blur
  - Header con portada y detalles
  - Lista de canciones estilo tabla
  - Hover effects
  - Responsive design
  - Animaciones suaves
```

---

## 📊 API de Spotify Usada

### Endpoint 1: **Obtener Canciones** (GET)
```javascript
GET https://api.spotify.com/v1/playlists/{playlist_id}/tracks
```

**Headers:**
```javascript
Authorization: Bearer {access_token}
```

**Response:**
```javascript
{
  items: [
    {
      added_at: "2024-01-15T10:30:00Z",
      track: {
        id: "abc123",
        name: "Song Name",
        artists: [{ name: "Artist Name" }],
        album: {
          name: "Album Name",
          images: [{ url: "..." }]
        },
        duration_ms: 210000,
        uri: "spotify:track:abc123"
      }
    }
  ]
}
```

---

### Endpoint 2: **Eliminar Canciones** (DELETE) ⚠️ **NUEVO**
```javascript
DELETE https://api.spotify.com/v1/playlists/{playlist_id}/tracks
```

**Headers:**
```javascript
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```javascript
{
  tracks: [
    { uri: "spotify:track:abc123" }
  ]
}
```

**Response:**
```javascript
{
  snapshot_id: "xyz789..." // ID de la versión actualizada de la playlist
}
```

**Status Codes:**
- `200 OK` → Canción eliminada exitosamente
- `401 Unauthorized` → Token inválido o expirado
- `403 Forbidden` → No tienes permisos para modificar la playlist
- `404 Not Found` → Playlist o canción no encontrada

---

## 🎨 Diseño Visual

### **Colores:**
```css
- Background: linear-gradient(145deg, #1a1a1a, #0d0d0d)
- Texto principal: #ece2d0
- Texto secundario: #d5b9b2
- Texto terciario: #a89888
- Hover: rgba(29, 185, 84, 0.1)
- Spotify green: #1DB954
```

### **Efectos:**
```css
- Box shadows neumorfistas
- Hover con cambio de color
- Transiciones suaves (0.3s)
- Animaciones de entrada (fadeIn, slideUp)
- Spinner rotativo para loading
```

---

## 📱 Diseño Responsive

### **Desktop (>1024px):**
```
Muestra todas las columnas:
# | Título | Álbum | Fecha | Duración
```

### **Tablet (768px-1024px):**
```
Oculta columna de fecha:
# | Título | Álbum | Duración
```

### **Mobile (<768px):**
```
Solo columnas esenciales:
# | Título | Duración

- Portada más pequeña
- Header en columna
- Footer en columna
- Botones full width
```

---

## 🚀 Flujo de Usuario

### Paso a Paso:

```
1. Usuario está en "Mis Playlists"
   ↓
2. Ve una playlist con "25 canciones"
   ↓
3. Hace clic en [🎵 Ver Canciones]
   ↓
4. Modal se abre con animación
   ↓
5. Muestra "Cargando canciones..."
   ↓
6. Carga 25 canciones desde Spotify
   ↓
7. Muestra lista completa
   ↓
8. Usuario puede:
   - Scroll por la lista
   - Click en canción → Abre en Spotify
   - Hover para ver botones 🔗 y 🗑️
   - Click 🔗 → Abre canción en Spotify
   - Click 🗑️ → Confirmación → Elimina canción ⚠️ NUEVO
   - Click en footer → Abre playlist completa
   - Click en ✕ → Cierra modal
```

---

## ✨ Características Adicionales

### 1. **Formato de Duración:**
```javascript
210000 ms → "3:30"
185000 ms → "3:05"
60000 ms  → "1:00"
```

### 2. **Formato de Fecha:**
```javascript
"2024-01-15" → "15 ene 2024"
"2023-12-25" → "25 dic 2023"
```

### 3. **Duración Total:**
```javascript
25 canciones × ~3.5 min promedio = ~87 min
Calculado sumando duration_ms de todas
```

### 4. **Manejo de Errores:**
```javascript
- Token expirado → Muestra error
- Playlist no encontrada → Muestra error
- Red fallida → Muestra error con botón reintentar
- Sin canciones → Muestra mensaje vacío
- Error al eliminar → Alert con mensaje específico ⚠️ NUEVO
- Sin permisos → Alert indicando falta de permisos ⚠️ NUEVO
```

---

## 🎯 Mejoras Futuras Posibles

### Potenciales Features:
```
- 🔍 Búsqueda de canciones en la lista
- ✅ 🗑️ Eliminar canciones individuales (IMPLEMENTADO)
- ⬆️⬇️ Reordenar canciones
- 📊 Ordenar por nombre/artista/fecha
- 💾 Exportar lista a CSV
- 🎵 Reproducir desde el modal
- ❤️ Marcar canciones como favoritas
- 🔀 Shuffle playlist
- 📋 Copiar lista de canciones
```

---

## 📝 Traducciones Incluidas

```javascript
viewSongs: 'Ver Canciones'
loadingSongs: 'Cargando canciones...'
errorLoadingSongs: 'Error cargando canciones'
noSongs: 'No hay canciones en esta playlist'
title: 'Título'
album: 'Álbum'
dateAdded: 'Fecha agregada'
songs: 'canciones'
openInSpotify: 'Abrir en Spotify'
retry: 'Reintentar'
customPlaylist: 'Playlist personalizada'
deleteTrack: 'Eliminar canción'                ⚠️ NUEVO
deleteTrackConfirm: '¿Eliminar esta canción?' ⚠️ NUEVO
deleteTrackError: 'Error al eliminar'          ⚠️ NUEVO
```

---

## ✅ Resultado Final

**El usuario ahora puede:**
- ✅ Ver todas las canciones de sus playlists
- ✅ Ver información completa de cada canción
- ✅ Abrir canciones individuales en Spotify
- ✅ **ELIMINAR canciones que no quiera** ⚠️ **NUEVO**
- ✅ Ver duración total y número de canciones
- ✅ Experiencia visual elegante y fluida
- ✅ Diseño responsive en todos los dispositivos
- ✅ Confirmación antes de eliminar
- ✅ Actualización inmediata de la lista

---

## 🗑️ FUNCIONALIDAD DE ELIMINACIÓN

### **Flujo de Eliminación:**

```
1. Usuario hace hover en una canción
   ↓
2. Aparecen botones 🔗 y 🗑️
   ↓
3. Usuario hace click en 🗑️
   ↓
4. Aparece confirmación:
   ┌──────────────────────────────────┐
   │ ¿Eliminar esta canción?          │
   │                                  │
   │ 🎵 Bohemian Rhapsody            │
   │ 👤 Queen                         │
   │                                  │
   │ ⚠️ Esta acción no se puede      │
   │    deshacer.                     │
   │                                  │
   │  [Cancelar]    [Aceptar]        │
   └──────────────────────────────────┘
   ↓
5. Si acepta:
   - Botón 🗑️ cambia a ⏳
   - Envía DELETE a Spotify API
   - Espera respuesta
   ↓
6. Si éxito:
   - Canción desaparece de la lista
   - Actualiza contador de canciones
   - Actualiza duración total
   ↓
7. Si error:
   - Muestra alert con error específico
   - Botón vuelve a 🗑️
   - Canción permanece en la lista
```

### **Características de Seguridad:**

```
✅ Confirmación obligatoria
✅ Muestra nombre y artista antes de eliminar
✅ Advertencia de acción irreversible
✅ Botón deshabilitado mientras elimina
✅ Manejo de errores con mensajes claros
✅ No permite eliminar múltiples a la vez (evita errores)
```

---

**¡Visualizador de canciones CON eliminación completamente funcional! 🎉🎵🗑️**

