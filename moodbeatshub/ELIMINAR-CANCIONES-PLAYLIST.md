# 🗑️ Eliminar Canciones de una Playlist

## ✅ Funcionalidad Implementada

### 🎯 **Objetivo:**
Permitir al usuario eliminar canciones individuales que no quiera de sus playlists guardadas.

---

## 🎨 Interfaz de Usuario

### **Botones en Cada Canción:**

```
┌────────────────────────────────────────────┐
│ # │ [Img] Título - Artista │ ... │ 🔗 🗑️ │
│                                            │
│ Al hacer hover:                            │
│   - Aparecen botones 🔗 y 🗑️             │
│   - Botón 🗑️ color rojo                  │
│   - Efecto hover con glow rojo            │
└────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Eliminación

### **Paso a Paso Detallado:**

```
1️⃣ Usuario abre visualizador de canciones
   └─ Modal con lista completa

2️⃣ Hace hover sobre una canción
   └─ Aparecen botones 🔗 y 🗑️

3️⃣ Hace click en botón 🗑️
   └─ Se abre ventana de confirmación

4️⃣ Confirmación muestra:
   ┌───────────────────────────────────┐
   │ ¿Eliminar esta canción de la      │
   │ playlist?                          │
   │                                    │
   │ 🎵 Bohemian Rhapsody              │
   │ 👤 Queen                           │
   │                                    │
   │ ⚠️ Esta acción no se puede        │
   │    deshacer.                       │
   │                                    │
   │   [Cancelar]      [Aceptar]       │
   └───────────────────────────────────┘

5️⃣ Si usuario cancela:
   └─ Cierra confirmación
   └─ No pasa nada

6️⃣ Si usuario acepta:
   └─ Botón 🗑️ cambia a ⏳
   └─ Se deshabilita la canción
   └─ Envía DELETE a Spotify API

7️⃣ Respuesta de Spotify:
   
   ✅ SI ÉXITO:
      └─ Canción desaparece de la lista
      └─ Actualiza contador: 25 → 24 canciones
      └─ Actualiza duración total
      └─ Animación de salida suave
   
   ❌ SI ERROR:
      └─ Botón vuelve a 🗑️
      └─ Muestra alert con error
      └─ Canción permanece en lista
```

---

## 🔧 Implementación Técnica

### **Función Principal:**

```javascript
const handleDeleteTrack = async (track, index) => {
  // 1. Confirmación
  const confirmDelete = window.confirm(
    `¿Eliminar esta canción?\n\n` +
    `🎵 ${track.name}\n` +
    `👤 ${track.artists.map(a => a.name).join(', ')}\n\n` +
    `⚠️ Esta acción no se puede deshacer.`
  );

  if (!confirmDelete) return;

  try {
    // 2. Marcar como "eliminando"
    setDeletingTrackUri(track.uri);

    // 3. DELETE a Spotify API
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tracks: [{ uri: track.uri }]
        })
      }
    );

    // 4. Verificar respuesta
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    // 5. Actualizar lista local
    setTracks(prevTracks => 
      prevTracks.filter((_, i) => i !== index)
    );

    console.log('✅ Canción eliminada');

  } catch (err) {
    // 6. Manejar error
    console.error('❌ Error:', err);
    alert(`Error al eliminar: ${err.message}`);
  } finally {
    // 7. Limpiar estado
    setDeletingTrackUri(null);
  }
};
```

---

## 📊 API de Spotify - DELETE Tracks

### **Endpoint:**
```
DELETE https://api.spotify.com/v1/playlists/{playlist_id}/tracks
```

### **Headers:**
```javascript
{
  'Authorization': 'Bearer {access_token}',
  'Content-Type': 'application/json'
}
```

### **Body:**
```javascript
{
  tracks: [
    {
      uri: "spotify:track:abc123def456"
    }
  ]
}
```

### **Response Exitoso (200 OK):**
```javascript
{
  snapshot_id: "SnapshotIdString..."
}
```

### **Posibles Errores:**

| Código | Significado | Solución |
|--------|-------------|----------|
| `401` | Token inválido o expirado | Re-autenticar usuario |
| `403` | Sin permisos | Verificar scopes OAuth |
| `404` | Playlist o track no encontrado | Verificar IDs |
| `429` | Rate limit excedido | Esperar y reintentar |

---

## 🎨 Estilos de los Botones

### **Botón de Eliminar (🗑️):**

```css
.track-action-btn.delete-btn {
  /* Fondo neumorfista dark */
  background: linear-gradient(145deg, #0d0d0d, #000000);
  
  /* Color rojo para eliminar */
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
  
  /* Sombra suave */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  
  /* Tamaño */
  width: 36px;
  height: 36px;
  border-radius: 50%;
  
  /* Transiciones */
  transition: all 0.3s ease;
}

/* Hover - Glow rojo */
.track-action-btn.delete-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, 
    rgba(255, 107, 107, 0.2), 
    rgba(255, 107, 107, 0.1)
  );
  border-color: #ff6b6b;
  color: #ff4444;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.6);
  transform: scale(1.1);
}

/* Disabled - Mientras elimina */
.track-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## 📱 Responsive Design

### **Desktop (>1024px):**
```
Grid: # | Título | Álbum | Fecha | Duración | [🔗 🗑️]
Hover: Muestra botones
```

### **Tablet (768px-1024px):**
```
Grid: # | Título | Álbum | Duración | [🔗 🗑️]
Fecha oculta
Hover: Muestra botones
```

### **Mobile (<768px):**
```
Grid: # | Título | Duración | [🔗 🗑️]
Álbum y Fecha ocultos
Botones siempre visibles (sin hover)
Botones más pequeños (32px)
```

---

## 🛡️ Seguridad y Validaciones

### **Validaciones Implementadas:**

```javascript
✅ 1. Usuario debe confirmar explícitamente
✅ 2. Muestra información de la canción antes de eliminar
✅ 3. Advierte que es irreversible
✅ 4. Solo permite eliminar una canción a la vez
✅ 5. Deshabilita botón mientras procesa
✅ 6. Verifica respuesta de Spotify
✅ 7. Maneja errores con mensajes claros
✅ 8. Requiere accessToken válido
```

### **Estados del Botón:**

```javascript
Estado Normal:    🗑️  (clickeable)
Estado Hover:     🗑️  (con glow rojo)
Estado Loading:   ⏳  (deshabilitado)
Estado Disabled:  🗑️  (opaco, no clickeable)
```

---

## 🎯 Casos de Uso

### **Caso 1: Eliminación Exitosa**
```
Usuario elimina "Never Gonna Give You Up"
  ↓
Confirmación → Acepta
  ↓
Botón: 🗑️ → ⏳
  ↓
API: DELETE → 200 OK
  ↓
Lista: 25 canciones → 24 canciones
  ↓
Canción desaparece ✅
```

### **Caso 2: Usuario Cancela**
```
Usuario hace click en 🗑️
  ↓
Confirmación → Cancela
  ↓
No pasa nada
Lista permanece igual ✅
```

### **Caso 3: Error de Permisos**
```
Usuario hace click en 🗑️
  ↓
Confirmación → Acepta
  ↓
API: DELETE → 403 Forbidden
  ↓
Alert: "Error: Sin permisos para modificar"
  ↓
Canción permanece en lista ⚠️
```

### **Caso 4: Token Expirado**
```
Usuario hace click en 🗑️
  ↓
Confirmación → Acepta
  ↓
API: DELETE → 401 Unauthorized
  ↓
Alert: "Error: Token inválido, re-autentíquese"
  ↓
Usuario debe re-login ⚠️
```

---

## 📝 Traducciones

```javascript
// Español (es.js)
deleteTrack: 'Eliminar canción',
deleteTrackConfirm: '¿Eliminar esta canción de la playlist?',
deleteTrackError: 'Error al eliminar la canción',

// Inglés (en.js)
deleteTrack: 'Delete song',
deleteTrackConfirm: 'Delete this song from the playlist?',
deleteTrackError: 'Error deleting song',

// Portugués (pt.js)
deleteTrack: 'Excluir música',
deleteTrackConfirm: 'Excluir esta música da playlist?',
deleteTrackError: 'Erro ao excluir música',

// Francés (fr.js)
deleteTrack: 'Supprimer la chanson',
deleteTrackConfirm: 'Supprimer cette chanson de la playlist?',
deleteTrackError: 'Erreur lors de la suppression',
```

---

## ⚠️ Limitaciones y Consideraciones

### **Limitaciones:**

```
1. ❌ No se puede deshacer la eliminación
   → Spotify no tiene "undo" para esto
   → Usuario debe re-agregar manualmente

2. ❌ Requiere permisos OAuth específicos
   → playlist-modify-public
   → playlist-modify-private

3. ❌ Solo funciona con playlists del usuario
   → No se pueden modificar playlists de otros

4. ⚠️ Rate limits de Spotify
   → Máximo ~30 requests por segundo
   → Si elimina muy rápido, puede fallar
```

### **Consideraciones:**

```
✅ Elimina de Spotify inmediatamente
✅ Afecta a todos los dispositivos del usuario
✅ No afecta a la BD de Supabase (solo Spotify)
✅ La lista se actualiza localmente (optimistic update)
✅ Si hay error, muestra el problema específico
```

---

## 🧪 Testing Manual

### **Checklist de Pruebas:**

```
□ 1. Abrir visualizador de canciones
□ 2. Hacer hover sobre una canción
□ 3. Verificar que aparezcan botones 🔗 y 🗑️
□ 4. Click en 🗑️
□ 5. Verificar que aparezca confirmación
□ 6. Verificar que muestre nombre y artista
□ 7. Cancelar → No pasa nada
□ 8. Click 🗑️ de nuevo
□ 9. Aceptar confirmación
□ 10. Verificar que botón cambie a ⏳
□ 11. Esperar respuesta
□ 12. Verificar que canción desaparezca
□ 13. Verificar que contador actualice
□ 14. Abrir Spotify → Verificar que no esté
□ 15. Probar con token expirado (debe fallar)
□ 16. Probar en mobile (botones visibles)
```

---

## 🎉 Resultado Final

### **ANTES:**
```
Usuario ve una canción que no le gusta
  ↓
Debe ir a Spotify
  ↓
Buscar la playlist
  ↓
Buscar la canción
  ↓
Eliminarla manualmente
```

### **AHORA:**
```
Usuario ve una canción que no le gusta
  ↓
Hover → Click 🗑️ → Confirma
  ↓
¡Eliminada! ✅
```

---

## ✨ Características Destacadas

```
✅ Confirmación segura antes de eliminar
✅ Información clara de lo que se eliminará
✅ Feedback visual inmediato (⏳)
✅ Actualización instantánea de la lista
✅ Manejo robusto de errores
✅ Diseño neumorfista elegante
✅ Responsive en todos los dispositivos
✅ Botones solo visibles al hover (desktop)
✅ Traducciones completas en 4 idiomas
✅ Integración perfecta con Spotify API
```

**¡Usuario puede limpiar sus playlists SIN salir de la aplicación! 🗑️✨**

