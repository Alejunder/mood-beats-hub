# ⚙️ Verificación de Configuración OAuth - Supabase

## Problema Identificado
El usuario experimenta loading eterno al intentar login/signup con Spotify. Los logs muestran que el callback OAuth es detectado pero Supabase no procesa correctamente la sesión.

## Causas Posibles

### 1. URL de Redirección No Configurada en Supabase ⚠️

**CRÍTICO:** La URL de redirección debe estar configurada en el dashboard de Supabase.

#### Pasos para Verificar:
1. Ir al dashboard de Supabase: https://supabase.com/dashboard
2. Seleccionar tu proyecto
3. Ir a **Authentication** → **URL Configuration**
4. Verificar que en **Redirect URLs** esté configurada tu URL:
   - Para desarrollo local: `http://localhost:5173/`
   - Para producción: `https://tudominio.com/`

#### Formato Correcto:
```
http://localhost:5173/
https://tudominio.vercel.app/
```

**IMPORTANTE:** Debe terminar con `/` y no debe incluir paths adicionales como `/callback` o `/auth`.

### 2. Configuración de Spotify Provider

Ir a **Authentication** → **Providers** → **Spotify** y verificar:

- ✅ Spotify provider está habilitado
- ✅ Client ID de Spotify está configurado
- ✅ Client Secret de Spotify está configurado
- ✅ Redirect URI en Spotify coincide con la de Supabase

#### Redirect URI en Spotify debe ser:
```
https://TUPROYECTO.supabase.co/auth/v1/callback
```

### 3. Variables de Entorno

Verificar que existan y sean correctas:

```env
VITE_APP_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_APP_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

## Cambios Implementados en el Código

### 1. Timeout de Seguridad (App.jsx)
- Agregado timeout de 10 segundos que verifica manualmente la sesión si no llega `SIGNED_IN`
- Previene loading eterno cuando el callback falla

### 2. Manejo de INITIAL_SESSION (App.jsx)
- Detecta cuando `INITIAL_SESSION` llega sin sesión durante un callback OAuth
- Limpia la URL y termina el loading correctamente
- Muestra error si hay uno en la URL

### 3. Limpieza de Timeout (App.jsx)
- El timeout se limpia automáticamente cuando llega `SIGNED_IN` exitosamente

### 4. Logging Mejorado (LoginTemplate.jsx)
- Ahora muestra explícitamente el `redirectTo` en consola
- Facilita debug de problemas de configuración

## Próximos Pasos para el Usuario

### Paso 1: Verificar Configuración de Supabase
1. Abrir dashboard de Supabase
2. Verificar Redirect URLs
3. Verificar configuración de Spotify provider

### Paso 2: Verificar Variables de Entorno
1. Crear archivo `.env` en la raíz del proyecto si no existe
2. Agregar las variables necesarias
3. Reiniciar el servidor de desarrollo

### Paso 3: Limpiar Estado y Reintentar
1. Limpiar localStorage del navegador
2. Limpiar sessionStorage
3. Cerrar y reabrir el navegador
4. Reintentar login/signup

### Paso 4: Revisar Logs
Después de intentar login/signup, revisar en consola:

```
🔐 Iniciando login con redirectTo: http://localhost:5173/
```

Si la URL es incorrecta, ajustar en Supabase.

## Logs Esperados (Flujo Exitoso)

```
🔄 Callback OAuth detectado en index.html - Preludio
🔧 Supabase client inicializado con detectSessionInUrl: true, flowType: pkce
🔄 Callback OAuth detectado - Dejando que Supabase lo procese automáticamente
⏳ Esperando evento SIGNED_IN de onAuthStateChange...
🔔 Auth state change: SIGNED_IN ✅ Con sesión
✅ Usuario autenticado: usuario@email.com
🧹 Limpiando parámetros OAuth de la URL
```

## Logs de Error (Flujo Fallido)

```
🔄 Callback OAuth detectado en index.html - Preludio
🔧 Supabase client inicializado con detectSessionInUrl: true, flowType: pkce
🔄 Callback OAuth detectado - Dejando que Supabase lo procese automáticamente
⏳ Esperando evento SIGNED_IN de onAuthStateChange...
🔔 Auth state change: INITIAL_SESSION ❌ Sin sesión
❌ INITIAL_SESSION sin sesión durante callback OAuth - callback falló
```

Si ves el segundo set de logs, el problema está en la configuración de Supabase o Spotify.

## Comandos Útiles

```bash
# Reiniciar servidor de desarrollo
npm run dev

# Verificar variables de entorno (en código)
console.log('Supabase URL:', import.meta.env.VITE_APP_SUPABASE_URL)
```

## Contacto
Si después de verificar todo sigue sin funcionar, compartir:
1. Los logs completos de consola
2. Screenshot de la configuración de Redirect URLs en Supabase
3. Screenshot de la configuración de Spotify provider
