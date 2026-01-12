# 🔍 OAuth Debugging Guide - Análisis Profundo

## 🚨 **Problema Identificado**

### Síntomas:
- URL después del callback: `https://mood-beats-six.vercel.app/?code=cf8efd81-...`
- Error: "Failed to fetch authenticator assurance level: Lock broken by another request with the 'steal' option"
- Usuario no autenticado después del redirect
- Página en blanco o error 404
- **Solo en producción (Vercel)**

---

## 💡 **Causa Raíz Confirmada**

### **Race Condition: Múltiples llamadas concurrentes a la sesión**

```
1. Spotify redirige → https://app.com/?code=xxx
2. Vercel sirve index.html ✅
3. index.html detecta ?code y marca en sessionStorage ✅
4. React se inicializa (main.jsx) ✅
5. Supabase detecta ?code automáticamente (detectSessionInUrl: true) ✅
6. App.jsx llama a getCurrentSession() ❌ CONFLICTO
7. Dos requests intentan acceder al lock simultáneamente ❌ ERROR
```

**El problema:** 
- `detectSessionInUrl: true` hace que Supabase procese el callback automáticamente
- `App.jsx` llamaba a `getCurrentSession()` al mismo tiempo
- Ambas operaciones intentaban escribir en localStorage simultáneamente
- El lock de localStorage se rompía ("steal" option)

---

## ✅ **Solución Implementada**

### 1. **Pre-detección en index.html (antes de React)**

```html
<!-- index.html -->
<script type="module">
  const urlParams = new URLSearchParams(window.location.search);
  const hasCode = urlParams.has('code');
  
  if (hasCode) {
    sessionStorage.setItem('oauth_callback_detected', 'true');
    sessionStorage.setItem('oauth_callback_timestamp', Date.now().toString());
  }
</script>
```

**Beneficio:** Detecta el callback ANTES de que React se monte.

---

### 2. **No llamar a getCurrentSession durante callbacks OAuth**

```javascript
// App.jsx - useEffect
const oauthCallbackDetected = sessionStorage.getItem('oauth_callback_detected');

if (oauthCallbackDetected === 'true') {
  console.log('🔄 Callback OAuth detectado - Dejando que Supabase lo procese automáticamente');
  
  // Limpiar marcadores
  sessionStorage.removeItem('oauth_callback_detected');
  sessionStorage.removeItem('oauth_callback_timestamp');
  
  // ❌ NO llamar a getCurrentSession aquí
  // ✅ Dejar que onAuthStateChange maneje la sesión después
  setLoading(true);
  return; // Salir sin llamar a getCurrentSession
}

// Solo verificar sesión si NO hay callback OAuth
const result = await getCurrentSession();
```

**Beneficio:** Evita la race condition que rompe el lock de localStorage.

---

### 3. **Limpieza Completa de URL**

```javascript
// Limpiar tanto query params (?code=) como hash (#access_token)
const cleanUrl = window.location.origin + window.location.pathname;
window.history.replaceState({}, document.title, cleanUrl);
```

**Beneficio:** URL limpia y sin parámetros OAuth visibles.

---

## 🔧 **Verificaciones Críticas en Supabase Dashboard**

### ⚠️ **IMPORTANTE: Configuración de Redirect URLs**

1. **Ir a Supabase Dashboard** → Tu proyecto → Authentication → URL Configuration

2. **Verificar estos campos:**

   **Site URL:**
   ```
   https://mood-beats-six.vercel.app
   ```

   **Redirect URLs (agregar AMBAS):**
   ```
   https://mood-beats-six.vercel.app
   https://mood-beats-six.vercel.app/
   ```

   **Nota:** Algunos proveedores OAuth son estrictos con trailing slashes.

3. **Additional Redirect URLs (si tienes):**
   - Asegúrate de incluir la URL de producción
   - NO usar `http://` en producción (solo `https://`)

4. **Guardar cambios** y esperar ~1 minuto para propagación

---

## 🧪 **Flujo Completo de OAuth PKCE**

### **Login Flow:**

```
1. Usuario → Click "Login with Spotify"
   ↓
2. Frontend → localStorage.setItem('authMode', 'login')
   ↓
3. Frontend → signInWithOAuth({ provider: 'spotify' })
   ↓
4. Supabase → Genera code_verifier + code_challenge (PKCE)
   ↓
5. Browser → Redirige a Spotify con code_challenge
   ↓
6. Spotify → Usuario autoriza
   ↓
7. Spotify → Redirige a https://app.com/?code=xxx
   ↓
8. index.html → Detecta ?code y marca en sessionStorage
   ↓
9. React → Se inicializa
   ↓
10. App.jsx → Lee marca de sessionStorage
   ↓
11. App.jsx → Espera 2 segundos (dinámico)
   ↓
12. Supabase (en background) → Intercambia code por tokens usando code_verifier
   ↓
13. App.jsx → getCurrentSession() → ✅ Sesión encontrada
   ↓
14. onAuthStateChange → SIGNED_IN event
   ↓
15. Frontend → Limpia URL (sin ?code)
   ↓
16. Usuario → Autenticado ✅
```

---

## 📊 **Logs Esperados en Consola (Producción)**

### **Flujo Exitoso:**

```
🔧 Supabase client inicializado con detectSessionInUrl: true y flowType: pkce
🔄 Callback OAuth detectado desde index.html, esperando procesamiento...
⏱️ Esperando 2000ms para procesamiento PKCE...
✅ Sesión encontrada después de callback
🔔 Auth state change: SIGNED_IN ✅ Con sesión
✅ Usuario autenticado: user@example.com
🧹 Limpiando parámetros OAuth de la URL
```

### **Flujo con Problemas:**

```
🔧 Supabase client inicializado...
🔄 Callback OAuth detectado...
⏱️ Esperando 2000ms...
ℹ️ No hay sesión activa: No hay sesión activa  ❌ PROBLEMA
```

Si ves esto, significa que Supabase no pudo intercambiar el `code` por tokens.

---

## 🐛 **Debugging Paso a Paso**

### **1. Verificar que el callback llegue correctamente**

Abrir DevTools → Console → Buscar:
```
🔄 Callback OAuth detectado en index.html - Preludio
```

Si NO aparece, el problema es que Vercel no está sirviendo `index.html`.

---

### **2. Verificar que Supabase detecte el callback**

Buscar en console:
```
🔧 Supabase client inicializado...
```

Debe aparecer INMEDIATAMENTE después de cargar la página.

---

### **3. Verificar procesamiento PKCE**

Buscar:
```
⏱️ Esperando Xms para procesamiento PKCE...
```

Si aparece pero luego falla, el problema está en:
- ❌ Redirect URLs mal configuradas en Supabase Dashboard
- ❌ Variables de entorno incorrectas (VITE_APP_SUPABASE_URL o VITE_APP_SUPABASE_ANON_KEY)
- ❌ Provider OAuth (Spotify) rechazando el callback

---

### **4. Verificar variables de entorno en Vercel**

1. Ir a Vercel Dashboard → Tu proyecto → Settings → Environment Variables

2. Verificar que existan:
   ```
   VITE_APP_SUPABASE_URL = https://pnyqzwkmlishtfunpdjf.supabase.co
   VITE_APP_SUPABASE_ANON_KEY = eyJhbGciOi... (tu key)
   ```

3. **IMPORTANTE:** Las variables deben tener el prefijo `VITE_APP_` para que Vite las exponga al frontend.

4. Si cambias las variables, hacer **Redeploy** (no solo rebuild).

---

## 🔐 **Verificar Configuración de Spotify (OAuth Provider)**

### En Spotify Developer Dashboard:

1. Ir a: https://developer.spotify.com/dashboard

2. Tu App → Settings → Redirect URIs

3. **Debe incluir:**
   ```
   https://pnyqzwkmlishtfunpdjf.supabase.co/auth/v1/callback
   ```

4. **NO debe incluir:**
   - Tu dominio directo (Supabase maneja el callback)
   - URLs con `http://` en producción

---

## 🛠️ **Comandos de Debugging**

### **Limpiar cache y hacer rebuild:**

```bash
# Limpiar cache local
rm -rf node_modules/.vite
rm -rf dist

# Reinstalar dependencias
npm install

# Build local para verificar
npm run build

# Probar localmente con preview
npm run preview
```

### **Verificar Supabase desde consola del browser:**

```javascript
// En DevTools → Console
localStorage.getItem('supabase.auth.token')

// Debe retornar algo como:
// {"access_token":"eyJhbGci...","refresh_token":"..."}
```

---

## 📋 **Checklist Final**

- [ ] ✅ Redirect URLs configuradas en Supabase Dashboard
- [ ] ✅ Variables de entorno con prefijo `VITE_APP_` en Vercel
- [ ] ✅ Spotify Redirect URI apunta a Supabase (no a tu dominio)
- [ ] ✅ `vercel.json` tiene `rewrites` correctos
- [ ] ✅ `index.html` tiene script de pre-detección
- [ ] ✅ `App.jsx` espera 2 segundos después de detectar callback
- [ ] ✅ `supabase.config.jsx` tiene `detectSessionInUrl: true` y `flowType: 'pkce'`
- [ ] ✅ Redeploy después de cualquier cambio en variables de entorno

---

## 🎯 **Próximos Pasos si Aún Falla**

1. **Activar debug en Supabase:**
   ```javascript
   // supabase.config.jsx
   debug: true  // Temporal
   ```

2. **Ver logs completos en Network tab:**
   - DevTools → Network
   - Buscar request a `/auth/v1/token`
   - Verificar respuesta (debe ser 200 OK con tokens)

3. **Verificar errores específicos:**
   - Si ves `invalid_grant` → code expiró o es inválido
   - Si ves `redirect_uri_mismatch` → URLs mal configuradas
   - Si ves `unauthorized_client` → Client ID/Secret incorrectos en Supabase

---

## 📞 **Contacto de Emergencia**

Si después de todas estas verificaciones sigue fallando:

1. Exportar logs completos de la consola
2. Screenshot de la configuración de Supabase Dashboard → URL Configuration
3. Screenshot de variables de entorno en Vercel
4. URL exacta donde falla

**Estado:** 🔧 En debugging - Solución implementada, pendiente de prueba
**Última actualización:** 2026-01-12
