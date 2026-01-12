# 🔐 Solución OAuth en Producción (Vercel)

## 📋 El Problema

El flujo OAuth con Spotify fallaba **exclusivamente en producción** (Vercel) después del login/registro, mostrando errores 404 o páginas en blanco. Funcionaba correctamente en desarrollo local.

### Causa Raíz

**Vercel no garantiza que `index.html` se sirva correctamente durante callbacks OAuth cuando se usa `rewrites`.**

Cuando Spotify redirige de vuelta a la app con parámetros OAuth (hash o query params), Vercel debe servir el `index.html` de la SPA **inmediatamente** para que React Router y Supabase procesen el callback. Con `rewrites`, este fallback no está garantizado en el edge de Vercel durante navegación OAuth.

---

## ✅ La Solución

### 1. **Cambiar de `rewrites` a `routes` en vercel.json**

**Antes:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Después:**
```json
{
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**¿Por qué?**
- `routes` con `handle: filesystem` garantiza que Vercel busque archivos estáticos primero
- Luego hace fallback a `index.html` para todas las rutas no estáticas
- Este comportamiento es determinista y funciona correctamente durante callbacks OAuth

---

### 2. **Optimizar detección de callback OAuth en App.jsx**

**Mejoras implementadas:**

```javascript
// Detectar explícitamente si estamos en medio de un callback OAuth
const hasOAuthParams = window.location.hash.includes('access_token') || 
                       window.location.search.includes('code=') ||
                       window.location.hash.includes('error');

if (hasOAuthParams) {
  console.log('🔄 Callback OAuth detectado, esperando procesamiento...');
  // Dar tiempo para que Supabase procese el callback
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

**Beneficios:**
- Detección temprana de callbacks OAuth
- Tiempo suficiente para que Supabase JS SDK procese los tokens
- Evita race conditions entre inicialización de React y procesamiento de auth

---

### 3. **Limpiar URL después del login exitoso**

```javascript
// En onAuthStateChange cuando SIGNED_IN
if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
  console.log('🧹 Limpiando parámetros OAuth de la URL');
  window.history.replaceState({}, document.title, window.location.pathname);
}
```

**Beneficios:**
- URL limpia después del login (mejor UX)
- Evita confusión con parámetros OAuth visibles
- Previene re-procesamiento de tokens si el usuario recarga

---

### 4. **Simplificar LoginTemplate.jsx**

**Cambios:**
- ❌ Eliminado: manejo redundante de errores OAuth de la URL (ya se hace en App.jsx)
- ❌ Eliminado: lógica de limpieza de `authMode` en múltiples lugares
- ✅ Simplificado: listener de `onAuthStateChange` solo resetea estados de loading

**Resultado:**
- Menos duplicación de lógica
- Separación clara de responsabilidades:
  - `App.jsx` = manejo de auth y callbacks OAuth
  - `LoginTemplate.jsx` = UI de login y disparo de OAuth

---

### 5. **Optimizar supabase.config.jsx**

**Cambios:**
```javascript
auth: {
  storage: window.localStorage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,  // ✅ Crucial para callbacks OAuth
  flowType: 'pkce',          // ✅ Flujo seguro recomendado
  storageKey: 'supabase.auth.token',
  debug: false               // Desactivado en producción
}
```

---

## 🔄 Flujo OAuth Correcto

### **Login con Spotify:**

1. **Usuario hace clic en "Login with Spotify"**
   - `localStorage.setItem('authMode', 'login')`
   - `localStorage.setItem('authTimestamp', Date.now())`
   - Redirect a Spotify OAuth

2. **Spotify redirige de vuelta con tokens**
   - URL: `https://tuapp.com/#access_token=...&refresh_token=...`
   - Vercel sirve `index.html` (gracias a `routes`)

3. **React App inicializa**
   - `App.jsx` detecta `hasOAuthParams = true`
   - Espera 1 segundo para procesamiento
   - Supabase JS SDK procesa automáticamente los tokens del hash

4. **Session creada**
   - `onAuthStateChange` dispara evento `SIGNED_IN`
   - Limpia URL de parámetros OAuth
   - Valida `authMode` con backend (opcional)
   - Usuario autenticado correctamente

---

## 📊 Diferencias: Desarrollo vs Producción

| Aspecto | Desarrollo (Vite) | Producción (Vercel) |
|---------|-------------------|---------------------|
| Servidor | Dev server integrado | Edge network global |
| Fallback SPA | Automático (Vite plugin) | Requiere config explícita |
| Callbacks OAuth | Siempre funciona | Necesita `routes` |
| Procesamiento | Síncrono | Puede ser asíncrono |

**Por eso el bug solo ocurría en producción.**

---

## 🧪 Cómo Probar

### En Producción (Vercel):

1. Desloguearse completamente
2. Hacer clic en "Login with Spotify"
3. Autorizar en Spotify
4. ✅ Verificar redirección exitosa a la app
5. ✅ Verificar URL limpia (sin `#access_token`)
6. ✅ Verificar que el usuario está autenticado

### Signup:

1. Hacer clic en "Signup with Spotify"  
2. Autorizar con cuenta nueva de Spotify
3. ✅ Mismo flujo sin errores

---

## 🚨 Errores Anteriores

### Síntomas:
- ❌ 404 después del callback OAuth
- ❌ Página en blanco
- ❌ `index.html` no encontrado
- ❌ Solo en producción (Vercel)

### Causa:
- `rewrites` no garantizaba fallback durante callbacks OAuth
- Vercel edge no servía `index.html` cuando había parámetros OAuth

---

## 📝 Checklist de Implementación

- [x] Cambiar `rewrites` a `routes` en `vercel.json`
- [x] Agregar headers de cache en `vercel.json`
- [x] Detectar callbacks OAuth en `App.jsx`
- [x] Limpiar URL después de login exitoso
- [x] Simplificar `LoginTemplate.jsx`
- [x] Optimizar config de Supabase
- [x] Eliminar logs de debug innecesarios
- [x] Probar en producción

---

## 🎯 Principios Aplicados

- **KISS**: Solución simple y directa (cambiar rewrites → routes)
- **DRY**: Eliminar duplicación de manejo de errores OAuth
- **Separation of Concerns**: App.jsx = auth, LoginTemplate = UI
- **Explicit over Implicit**: Detección explícita de callbacks OAuth

---

## 📚 Referencias

- [Vercel Routes vs Rewrites](https://vercel.com/docs/edge-network/redirects-rewrites)
- [Supabase Auth Configuration](https://supabase.com/docs/reference/javascript/initializing)
- [OAuth PKCE Flow](https://oauth.net/2/pkce/)

---

## 🔧 Archivos Modificados

1. ✅ `vercel.json` - Routes + headers
2. ✅ `src/App.jsx` - Detección y limpieza OAuth
3. ✅ `src/components/templates/LoginTemplate.jsx` - Simplificación
4. ✅ `src/supabase/supabase.config.jsx` - Config optimizada

---

**Estado:** ✅ Solucionado y probado en producción
**Fecha:** 2026-01-12
**Impacto:** Alto - Login/Signup funcional en producción
