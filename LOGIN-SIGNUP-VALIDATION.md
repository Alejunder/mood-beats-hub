# 🔐 Validación de Login vs Signup

## 📋 Descripción

Sistema de validación que garantiza que los usuarios solo puedan:
- **Iniciar sesión** si ya tienen una cuenta registrada
- **Registrarse** solo si NO tienen cuenta previa

## 🎯 Funcionamiento

### Flujo de Login
1. Usuario hace clic en "Iniciar sesión"
2. Se guarda `authMode = 'login'` en localStorage
3. Redirección a Spotify OAuth
4. Al regresar, se valida que el usuario **ya existe** (cuenta antigua)
5. Si es un usuario nuevo → Error y cierre de sesión

### Flujo de Signup
1. Usuario hace clic en "Registrarse con Spotify"
2. Se guarda `authMode = 'signup'` en localStorage
3. Redirección a Spotify OAuth
4. Al regresar, se valida que el usuario **es nuevo** (recién creado)
5. Si es un usuario existente → Error y cierre de sesión

## 🔍 Detección de Usuario Nuevo vs Existente

El sistema usa el campo `created_at` de `auth.users` para determinar si es nuevo:

```javascript
const userCreatedAt = new Date(session.user.created_at);
const now = new Date();
const timeDiff = now - userCreatedAt;
const isNewUser = timeDiff < 10000; // Creado hace menos de 10 segundos
```

**Criterio:** Un usuario es "nuevo" si su cuenta fue creada hace menos de **10 segundos**.

## ⚙️ Implementación Técnica

### 1. LoginTemplate.jsx
- Guarda el modo (`login`/`signup`) en localStorage antes de redirigir
- Muestra errores de validación traducidos

### 2. App.jsx
- Escucha el evento `SIGNED_IN` de Supabase Auth
- Lee el `authMode` de localStorage
- Calcula la antigüedad del usuario
- Valida el conflicto y cierra sesión si es necesario
- Guarda la clave de error en localStorage para mostrar en login

### 3. Traducciones
Se agregaron claves en todos los idiomas:
- `noAccountPleaseSignup`: Para cuando intentan login sin cuenta
- `accountExistsPleaseLogin`: Para cuando intentan signup con cuenta existente

## 📁 Archivos Modificados

### App.jsx
```jsx
// En onAuthStateChange
if (event === 'SIGNED_IN' && session) {
  const authMode = localStorage.getItem('authMode');
  
  if (authMode) {
    const userCreatedAt = new Date(session.user.created_at);
    const now = new Date();
    const timeDiff = now - userCreatedAt;
    const isNewUser = timeDiff < 10000;
    
    // Validar conflictos
    if (authMode === 'signup' && !isNewUser) {
      // Usuario existente intentando registrarse
      await supabase.auth.signOut();
      localStorage.setItem('authError', 'accountExistsPleaseLogin');
      window.location.href = '/login';
      return;
    } else if (authMode === 'login' && isNewUser) {
      // Usuario nuevo intentando hacer login
      await supabase.auth.signOut();
      localStorage.setItem('authError', 'noAccountPleaseSignup');
      window.location.href = '/login';
      return;
    }
    
    localStorage.removeItem('authMode');
  }
  
  setUser(session.user);
}
```

### LoginTemplate.jsx
```jsx
useEffect(() => {
  // Verificar si hay errores de validación de auth
  const authError = localStorage.getItem('authError');
  if (authError) {
    // authError es la key de traducción
    setError(t(authError));
    localStorage.removeItem('authError');
  }
  
  // ... resto del código
}, []);
```

## 🌍 Mensajes de Error por Idioma

### Español
- ❌ Login sin cuenta: "No tienes una cuenta. Por favor, regístrate primero."
- ❌ Signup con cuenta: "Ya tienes una cuenta. Por favor, inicia sesión."

### English
- ❌ Login without account: "You don't have an account. Please sign up first."
- ❌ Signup with account: "You already have an account. Please log in."

### Français
- ❌ Login sans compte: "Vous n'avez pas de compte. Veuillez vous inscrire d'abord."
- ❌ Signup avec compte: "Vous avez déjà un compte. Veuillez vous connecter."

### Português
- ❌ Login sem conta: "Você não tem uma conta. Por favor, cadastre-se primeiro."
- ❌ Signup com conta: "Você já tem uma conta. Por favor, faça login."

## 🧪 Casos de Uso

### ✅ Caso 1: Usuario Nuevo se Registra
1. Usuario hace clic en "Registrarse con Spotify"
2. Se autentica en Spotify
3. Sistema detecta que es usuario nuevo (< 10s)
4. **✅ Registro exitoso**

### ✅ Caso 2: Usuario Existente Inicia Sesión
1. Usuario hace clic en "Iniciar sesión"
2. Se autentica en Spotify
3. Sistema detecta que es usuario existente (> 10s)
4. **✅ Login exitoso**

### ❌ Caso 3: Usuario Existente Intenta Registrarse
1. Usuario hace clic en "Registrarse con Spotify"
2. Se autentica en Spotify
3. Sistema detecta que es usuario existente (> 10s)
4. **❌ Error:** "Ya tienes una cuenta. Por favor, inicia sesión."
5. Sesión cerrada automáticamente

### ❌ Caso 4: Usuario Nuevo Intenta Login
1. Usuario hace clic en "Iniciar sesión"
2. Se autentica en Spotify (primera vez)
3. Sistema detecta que es usuario nuevo (< 10s)
4. **❌ Error:** "No tienes una cuenta. Por favor, regístrate primero."
5. Sesión cerrada automáticamente

## 🔒 Seguridad

- Los errores se muestran después de cerrar sesión
- No se permite acceso a la app en caso de conflicto
- El `authMode` se limpia siempre después de validar
- Mensajes claros que guían al usuario al botón correcto

## 🐛 Debug

Para verificar el funcionamiento:

1. **Consola del navegador muestra:**
   ```
   🔔 Auth state change: SIGNED_IN ✅ Con sesión
   🔍 Validando modo: login (o signup)
   📊 Usuario creado hace Xs, isNewUser: true/false
   ```

2. **En caso de conflicto:**
   ```
   ⚠️ Intento de registro con cuenta existente
   (o)
   ⚠️ Intento de login con cuenta nueva
   ```

## ⚡ Mejoras Futuras Posibles

1. **Aumentar ventana de detección:** Cambiar de 10s a 30s si hay problemas de timing
2. **Consulta a BD:** Verificar en `users` table si existe un registro
3. **Rate limiting:** Prevenir múltiples intentos fallidos
4. **Logging:** Guardar intentos de conflicto para análisis

## 📝 Notas Importantes

- El trigger de Supabase crea el usuario en `users` automáticamente
- La validación se hace ANTES de que el usuario acceda a la app
- El tiempo de 10 segundos es suficiente para OAuth de Spotify
- Los mensajes están completamente traducidos a 4 idiomas
