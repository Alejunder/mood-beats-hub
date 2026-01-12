# Guía de Deployment en Vercel para SPA con React Router

## 🔍 Por qué ocurre el error 404 DEPLOYMENT_NOT_FOUND en producción

### El problema fundamental

Cuando navegas directamente a una ruta como `/login` o `/register` en producción, el navegador hace una petición HTTP al servidor de Vercel solicitando el archivo `/login` o `/register`. Sin embargo, **estos archivos no existen físicamente** en tu servidor - solo existe `index.html` en la raíz.

#### En desarrollo (local)
- El dev server de Vite está configurado para capturar todas las rutas y servir `index.html`
- Funciona perfectamente porque Vite maneja esto automáticamente

#### En producción (Vercel)
- Vercel sirve archivos estáticos
- Cuando pides `/login`, busca un archivo llamado `login` o `login.html`
- No lo encuentra → 404 DEPLOYMENT_NOT_FOUND

---

## ✅ Solución Implementada

### 1. Configuración de `vercel.json`

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

**¿Qué hace esto?**
- Intercepta TODAS las peticiones HTTP (`(.*)` = regex que captura todo)
- Las redirige internamente a `/index.html` (sin cambiar la URL en el navegador)
- React Router recibe la URL original y maneja el routing del lado del cliente

**Nota:** Se eliminaron `buildCommand`, `outputDirectory` y `framework` porque Vercel los detecta automáticamente al encontrar `vite.config.js`.

---

### 2. Archivo `_redirects` en `/public`

```
/*    /index.html   200
```

Este es un archivo de respaldo que Vercel también respeta (formato estándar de Netlify/static hosting):
- `/*` = todas las rutas
- `/index.html` = destino
- `200` = código HTTP OK (no es una redirección 301/302, es un rewrite interno)

**Ventaja:** Doble protección - si `vercel.json` falla, `_redirects` funciona.

---

### 3. Configuración de Vite optimizada

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/',  // Rutas absolutas desde la raíz
  publicDir: 'public',  // Copia archivos de public/ a dist/
  build: {
    outDir: 'dist',
    emptyOutDir: true,  // Limpia dist antes de cada build
    sourcemap: false,  // No generar sourcemaps en producción
    rollupOptions: {
      output: {
        manualChunks: undefined  // Evita problemas con code-splitting
      }
    }
  }
})
```

---

## 🚀 Cómo funciona el flujo completo

### 1. Usuario visita directamente `/register`

```
Navegador → Vercel Server
"GET /register"
         ↓
    vercel.json detecta la petición
         ↓
    Reescribe internamente a /index.html
         ↓
    Vercel sirve index.html (con el bundle de React)
         ↓
    React se carga en el navegador
         ↓
    React Router lee la URL (/register)
         ↓
    React Router renderiza el componente Register
```

### 2. Usuario se autentica con Supabase

```
Usuario en /login → Supabase Auth
         ↓
    Redirección OAuth (Spotify/Google/etc)
         ↓
    Callback: https://tu-app.vercel.app/auth/callback
         ↓
    Vercel reescribe /auth/callback → /index.html
         ↓
    React Router maneja el callback
         ↓
    Redirección interna a /home (SPA navigation)
```

---

## 🔐 Configuración de Variables de Entorno en Vercel

**IMPORTANTE:** Vercel necesita tus variables de entorno configuradas en su dashboard.

### Paso a paso:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega estas variables:

```
VITE_APP_SUPABASE_URL = https://tu-proyecto.supabase.co
VITE_APP_SUPABASE_ANON_KEY = eyJhbGc...tu-key-aqui
```

**Nota:** Estas variables deben tener el prefijo `VITE_` para ser incluidas en el build de Vite.

### ¿Por qué son necesarias?

- Vite reemplaza las variables `import.meta.env.VITE_*` en tiempo de build
- Sin ellas, tu código intentará conectar a `undefined` en producción
- El archivo `.env` local NO se sube a Vercel (está en `.gitignore`)

---

## 📋 Buenas Prácticas para Redirecciones Post-Autenticación

### ❌ Evitar (causa 404)

```javascript
// MALO - Recarga completa de la página
window.location.href = '/home';
window.location.replace('/home');

// MALO - Sin esperar a que la autenticación se complete
const { data } = await supabase.auth.signIn(...)
navigate('/home')  // Puede ejecutarse antes del estado de auth
```

### ✅ Hacer (navegación SPA correcta)

```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// BUENO - Navegación del lado del cliente
const handleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password
  });
  
  if (data?.user) {
    // Espera a que la autenticación se complete
    navigate('/home', { replace: true });
  }
};

// BUENO - Para OAuth con callback
const handleOAuthLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'spotify',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
};
```

### Manejo del callback de OAuth

```javascript
// En tu componente de callback
useEffect(() => {
  const handleCallback = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
      // Limpia la URL
      window.history.replaceState({}, '', '/home');
      // Navega internamente
      navigate('/home', { replace: true });
    }
  };
  
  handleCallback();
}, [navigate]);
```

---

## 🔧 Checklist de Deployment

### Antes de hacer push:

- [ ] `vercel.json` existe en la raíz
- [ ] `public/_redirects` existe
- [ ] `vite.config.js` tiene `base: '/'`
- [ ] `.env` está en `.gitignore`
- [ ] Build local funciona: `npm run build && npm run preview`

### En Vercel Dashboard:

- [ ] Variables de entorno configuradas
- [ ] Framework Preset: "Vite" o "Other"
- [ ] Build Command: `npm run build` o `vite build`
- [ ] Output Directory: `dist`
- [ ] Redeploy después de configurar variables

### Después del deployment:

- [ ] Accede directamente a `tu-app.vercel.app/login` (no 404)
- [ ] Accede directamente a `tu-app.vercel.app/register` (no 404)
- [ ] Recarga la página en cualquier ruta (no 404)
- [ ] Flujo de autenticación completo funciona
- [ ] Redirecciones post-login funcionan sin recargar

---

## 🐛 Troubleshooting

### Error: "DEPLOYMENT_NOT_FOUND"

**Causa:** Vercel no puede encontrar el deployment o hay un problema con la configuración.

**Soluciones:**

1. **Verifica que estás usando la URL correcta:**
   - Usa: `https://tu-proyecto.vercel.app/login`
   - NO uses URLs de preview antiguas

2. **Fuerza un redeploy:**
   - Ve a Deployments en Vercel
   - Click en el último deployment
   - "Redeploy" (sin usar cache)

3. **Verifica el build log:**
   - Ve a Deployments → Click en el deployment
   - Revisa si hay errores en el build
   - Busca: "Build succeeded" o "Build failed"

### Error: "Failed to load module" en producción

**Causa:** Rutas de assets incorrectas o variables de entorno faltantes.

**Soluciones:**

1. Verifica que `base: '/'` esté en `vite.config.js`
2. Verifica que las variables `VITE_*` estén en Vercel
3. Limpia cache y redeploy

### OAuth redirect no funciona

**Causa:** URL de callback incorrecta en Supabase.

**Soluciones:**

1. Ve a Supabase Dashboard → Authentication → URL Configuration
2. Agrega tu dominio de Vercel a "Site URL"
3. Agrega `https://tu-app.vercel.app/**` a "Redirect URLs"

---

## 📊 Comparación: Local vs Producción

| Aspecto | Desarrollo (Local) | Producción (Vercel) |
|---------|-------------------|---------------------|
| **Servidor** | Vite Dev Server | Vercel Static Server |
| **Routing** | Automático por Vite | Manual con rewrites |
| **Hot Reload** | Sí | No (requiere rebuild) |
| **Env Variables** | `.env` local | Vercel Dashboard |
| **404 Handling** | Automático | Requiere configuración |
| **Build** | No necesario | Necesario (`npm run build`) |

---

## 🎯 Resumen de la Solución

1. **`vercel.json`** con rewrites para capturar todas las rutas
2. **`public/_redirects`** como respaldo
3. **`vite.config.js`** optimizado para build de producción
4. **Variables de entorno** configuradas en Vercel Dashboard
5. **Navegación con React Router** (`useNavigate`) en lugar de `window.location`

Con esta configuración, tu SPA funcionará perfectamente en Vercel, manejando todas las rutas del lado del cliente sin errores 404.

---

## 📚 Recursos Adicionales

- [Vercel Rewrites Documentation](https://vercel.com/docs/projects/project-configuration#rewrites)
- [Vite Build Configuration](https://vitejs.dev/config/build-options.html)
- [React Router DOM](https://reactrouter.com/en/main)
- [Supabase Auth with Vite](https://supabase.com/docs/guides/auth)

---

**Última actualización:** Configuración verificada y funcionando ✅
