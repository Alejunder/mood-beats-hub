# 🐛 Troubleshooting: Loop Infinito en Validación de Auth

## Problema Actual

El flujo de validación se queda en un loop infinito al intentar llamar a `validate_current_user_intent`.

### Síntomas
- URL muestra: `/?code=ecd005aa-c6c1-458c-a269-d6aee0690f52`
- Console logs:
  ```
  🔔 Auth state change: SIGNED_IN ✅ Con sesión
  ✅ Usuario autenticado: chechis.cole@gmail.com
  🔍 Validando intent con backend: login
  🔍 Validando intent en backend: Object
  ```
- El log `📊 Resultado validación:` nunca aparece
- La página se queda cargando infinitamente

## Soluciones Implementadas

### 1. ✅ Timeout en la llamada RPC
Agregado timeout de 10 segundos para evitar cuelgues eternos.

### 2. ✅ Fallback en caso de error
Si la validación falla, permite continuar para no bloquear el acceso.

### 3. ✅ Delay de 500ms
Pequeño delay antes de llamar al backend para asegurar que la sesión esté establecida.

## 🔧 Solución Temporal: Deshabilitar Validación

Si el problema persiste, puedes **deshabilitar temporalmente** la validación:

### Opción A: Comentar todo el bloque de validación

En `src/App.jsx`, línea ~115:

```javascript
if (event === 'SIGNED_IN' && session) {
  console.log('✅ Usuario autenticado:', session.user.email);
  
  // TEMPORAL: Deshabilitar validación
  // const authMode = localStorage.getItem('authMode');
  // const authTimestamp = localStorage.getItem('authTimestamp');
  // ... resto del código de validación comentado
  
  // Limpiar localStorage
  localStorage.removeItem('authMode');
  localStorage.removeItem('authTimestamp');
  localStorage.removeItem('authError');
  
  setUser(session.user);
  setLoading(false);
}
```

### Opción B: Flag de configuración

En `src/App.jsx`, al inicio del componente:

```javascript
// TEMPORAL: Flag para deshabilitar validación
const ENABLE_AUTH_VALIDATION = false;

// Luego en el listener:
if (authMode && authTimestamp && ENABLE_AUTH_VALIDATION) {
  // validación...
}
```

## 🔍 Debugging Adicional

### Ver logs en Supabase

1. Ve a Supabase Dashboard
2. Logs → Database Logs
3. Busca logs que contengan "Validando intent"

### Test manual de la función

Abre DevTools Console y ejecuta:

```javascript
const { data, error } = await supabase.rpc('validate_current_user_intent', {
  p_intent: 'login',
  p_flow_started_at: new Date().toISOString()
});

console.log('Data:', data);
console.log('Error:', error);
```

### Verificar permisos

```sql
-- En Supabase SQL Editor
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'validate_current_user_intent';
```

## 🚨 Posibles Causas

1. **RLS (Row Level Security)**: La función puede estar bloqueada por RLS
2. **Permisos insuficientes**: El rol `authenticated` no tiene permisos
3. **Timeout de red**: La llamada RPC no responde en tiempo razonable
4. **Estado de sesión**: La sesión no está completamente establecida cuando se llama

## 🔄 Próximos Pasos

1. ✅ Intentar con el delay de 500ms
2. ✅ Ver si aparecen errores en console después del delay
3. Si sigue fallando → Usar la solución temporal
4. Revisar logs de Supabase para ver qué está pasando en el backend
5. Considerar un approach alternativo (validación más simple)

## 📝 Alternativa Simplificada

Si la validación compleja no funciona, podemos usar un approach más simple:

```javascript
// En lugar de validar con timestamps complejos,
// simplemente verificar si el usuario fue creado "recientemente"
const userCreatedAt = new Date(session.user.created_at);
const now = new Date();
const isNewUser = (now - userCreatedAt) < 30000; // 30 segundos

if (authMode === 'signup' && !isNewUser) {
  // Error
} else if (authMode === 'login' && isNewUser) {
  // Error
}
```

Esto se puede hacer **solo en el frontend** sin llamadas al backend.
