# 🎵 Solución: No se Agregan Canciones a Spotify

## 🔍 Diagnóstico del Problema

Si las canciones no se están agregando a las playlists de Spotify, sigue estos pasos:

### 1. ✅ Verifica los Logs en Consola

Abre la consola del navegador (F12) y busca:

```
🎵 Agregando canciones a la playlist: { ... }
```

#### Si ves error 403 (Forbidden):
```
❌ Error de Spotify: { status: 403, error: { message: "Insufficient client scope" } }
```

**Solución:** Necesitas volver a iniciar sesión para obtener los nuevos permisos.

#### Si ves error 401 (Unauthorized):
```
❌ Error de Spotify: { status: 401, error: { message: "The access token expired" } }
```

**Solución:** El token expiró. Cierra sesión y vuelve a iniciar sesión.

#### Si ves error 404 (Not Found):
```
❌ Error de Spotify: { status: 404, error: { message: "Playlist not found" } }
```

**Solución:** La playlist no existe o fue eliminada. Intenta con otra playlist.

---

## 🔄 Pasos para Resolver

### Paso 1: Cerrar Sesión
1. Haz clic en el botón "Cerrar Sesión" en la aplicación
2. Espera a que te redirija a la página de login

### Paso 2: Iniciar Sesión de Nuevo
1. Haz clic en "Iniciar sesión con Spotify"
2. **IMPORTANTE:** Spotify te pedirá autorizar nuevos permisos
3. Revisa que aparezcan estos permisos:
   - ✅ Ver tu correo
   - ✅ Ver tu perfil
   - ✅ Ver tus artistas favoritos
   - ✅ Ver playlists privadas
   - ✅ **Modificar playlists públicas** ⬅️ IMPORTANTE
   - ✅ **Modificar playlists privadas** ⬅️ IMPORTANTE
   - ✅ Reproducir música

### Paso 3: Autorizar Permisos
1. Haz clic en "Aceptar" o "Autorizar"
2. Espera a que te redirija de vuelta a la aplicación

### Paso 4: Probar Agregar Canciones
1. Ve a "Mis Playlists"
2. Selecciona una playlist
3. Haz clic en "Agregar Canciones"
4. Busca y selecciona canciones
5. Haz clic en "Agregar"

---

## 🛠️ Validaciones Técnicas

### ¿Cómo saber si funcionó?

**En la consola verás:**
```
🎵 Agregando canciones a la playlist: {
  playlistId: "abc123...",
  songsCount: 3,
  uris: ["spotify:track:...", ...]
}
✅ Canciones agregadas exitosamente: { snapshot_id: "..." }
```

**Y aparecerá un alert:**
```
✅ 3 canciones agregadas exitosamente
```

---

## 🔐 Permisos Requeridos

Los siguientes scopes de Spotify son necesarios:

```javascript
user-read-email
user-read-private
user-top-read
user-read-recently-played
playlist-read-private
playlist-modify-public     ⬅️ Para modificar playlists públicas
playlist-modify-private    ⬅️ Para modificar playlists privadas
user-library-read
streaming
```

Estos scopes ya están configurados en `LoginTemplate.jsx`.

---

## ⚠️ Problemas Comunes

### 1. "Insufficient client scope"
**Causa:** No tienes permisos para modificar playlists
**Solución:** Volver a iniciar sesión

### 2. "The access token expired"
**Causa:** Tu sesión expiró
**Solución:** Cerrar sesión e iniciar de nuevo

### 3. "Playlist not found"
**Causa:** La playlist fue eliminada o no existe
**Solución:** Crear una nueva playlist

### 4. "Only valid bearer authentication supported"
**Causa:** Token inválido o mal formateado
**Solución:** Cerrar sesión e iniciar de nuevo

---

## 🧪 Cómo Probar

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña "Console"**
3. **Intenta agregar canciones**
4. **Observa los logs:**
   - ✅ Si ves "✅ Canciones agregadas exitosamente" → Funcionó
   - ❌ Si ves "❌ Error de Spotify" → Sigue los pasos de arriba

---

## 📝 Notas Adicionales

- **Spotify Premium no es necesario** para agregar canciones
- **Puedes agregar hasta 100 canciones** a la vez
- **Las canciones se agregan al final** de la playlist
- **Los cambios son instantáneos** en Spotify
- **Verifica en la app de Spotify** que las canciones se agregaron correctamente

---

## 🆘 Si Sigue Sin Funcionar

1. **Borra el caché del navegador**
2. **Prueba en modo incógnito**
3. **Verifica que tu cuenta de Spotify esté activa**
4. **Comprueba tu conexión a internet**
5. **Revisa en [Spotify Dashboard](https://accounts.spotify.com/en/status) que tienes acceso**

---

## ✅ Checklist Final

- [ ] He cerrado sesión
- [ ] He vuelto a iniciar sesión
- [ ] He autorizado TODOS los permisos
- [ ] He abierto la consola del navegador
- [ ] He intentado agregar canciones
- [ ] He verificado los logs en consola
- [ ] He comprobado en Spotify que las canciones se agregaron

Si seguiste todos estos pasos y sigue sin funcionar, revisa los logs de consola y busca el mensaje de error específico.

