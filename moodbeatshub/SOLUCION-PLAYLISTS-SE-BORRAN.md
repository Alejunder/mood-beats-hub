# 🔧 Solución: Playlists se eliminan al cerrar sesión

## 🐛 Problema

Cuando un usuario cierra sesión en la aplicación, sus playlists guardadas desaparecen. Al volver a iniciar sesión, las playlists que había creado anteriormente ya no están.

## 🔍 Causa del Problema

El problema tiene dos causas principales:

### 1. **Políticas RLS (Row Level Security) mal configuradas**

Supabase usa Row Level Security para controlar qué datos puede ver cada usuario. Si las políticas están mal configuradas:
- Las playlists podrían estar vinculadas al `auth.uid()` que cambia entre sesiones
- Las políticas podrían estar bloqueando el acceso después de cerrar sesión
- Las Foreign Keys podrían tener `CASCADE DELETE` que borra datos relacionados

### 2. **Relación entre usuarios y auth**

El problema es que:
- Spotify OAuth genera un usuario en `auth.users` de Supabase
- Tu aplicación guarda datos en la tabla `users` personalizada
- Las playlists se vinculan a `user_id` de tu tabla `users`
- Si la relación entre `auth.users` y tu tabla `users` no es correcta, los datos se pierden

## ✅ Solución

### PASO 1: Ejecutar el script SQL en Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto (pnyqzwkmlishtfunpdjf)
3. Ve a **SQL Editor** (icono de archivo en el menú lateral)
4. Abre el archivo `fix-rls-policies.sql` que acabo de crear
5. Copia todo el contenido
6. Pégalo en el SQL Editor
7. Haz clic en **Run** para ejecutar

Este script hace lo siguiente:
- ✅ Elimina la relación `CASCADE DELETE` entre `users` y `spotify_playlists`
- ✅ Crea políticas RLS correctas que persisten entre sesiones
- ✅ Vincula las playlists al EMAIL del usuario (que no cambia)
- ✅ Mejora el performance con índices

### PASO 2: Verificar la configuración

Después de ejecutar el script, verifica que las políticas se crearon correctamente:

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'spotify_playlists');
```

Deberías ver estas políticas:
- `users_select_policy`
- `users_insert_policy`
- `users_update_policy`
- `playlists_select_policy`
- `playlists_insert_policy`
- `playlists_update_policy`
- `playlists_delete_policy`
- `moods_select_policy`

### PASO 3: Probar la solución

1. **Cierra todas las sesiones activas:**
   - En tu app, haz clic en "Cerrar sesión"

2. **Inicia sesión nuevamente:**
   - Inicia sesión con tu cuenta de Spotify
   - Ahora se te pedirá seleccionar tu cuenta (gracias al cambio anterior)

3. **Crea una playlist de prueba:**
   - Ve a "Personalizar Playlist"
   - Completa el cuestionario
   - Guarda la playlist como favorita

4. **Cierra sesión y vuelve a iniciar:**
   - Cierra sesión
   - Inicia sesión de nuevo
   - Ve a "Playlists Favoritas"
   - **¡Tu playlist debería estar ahí!** 🎉

## 🔒 Explicación Técnica

### Antes (❌ Problema)

```javascript
// Las playlists se buscaban por user_id
const { data } = await supabase
  .from('spotify_playlists')
  .select('*')
  .eq('user_id', userId);  // ⚠️ user_id podría cambiar

// Las políticas RLS estaban vinculadas a auth.uid()
CREATE POLICY "..." ON spotify_playlists
USING (user_id = auth.uid()::text);  // ❌ auth.uid() cambia entre sesiones
```

### Después (✅ Solución)

```sql
-- Las políticas ahora buscan por EMAIL (que no cambia)
CREATE POLICY "playlists_select_policy" ON spotify_playlists
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE email = auth.jwt()->>'email'  -- ✅ Email persiste
  )
);

-- Sin CASCADE DELETE
ALTER TABLE spotify_playlists
ADD CONSTRAINT spotify_playlists_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE RESTRICT;  -- ✅ No borra playlists al borrar usuario
```

## 📝 Notas Adicionales

### ¿Por qué usar el email en vez del auth.uid()?

- **Email**: Es constante y no cambia entre sesiones de OAuth
- **auth.uid()**: Puede variar según cómo Spotify maneje las sesiones
- **user_id de tu tabla**: Es estable si está vinculado al email

### ¿Y si tengo datos antiguos perdidos?

Lamentablemente, si los datos ya fueron eliminados por `CASCADE DELETE` o políticas RLS incorrectas, **no se pueden recuperar**. Sin embargo:
- Las playlists en Spotify siguen existiendo (solo se borraron de tu BD)
- Los usuarios pueden volver a generar y guardar playlists
- A partir de ahora, las nuevas playlists ya no se perderán

### Prevención futura

El script SQL que ejecutaste incluye:
- `ON DELETE RESTRICT`: Evita borrar usuarios que tengan playlists
- Políticas RLS basadas en email: Persisten entre sesiones
- Índices: Mejoran el performance de las búsquedas

## 🎯 Resumen

| Antes | Después |
|-------|---------|
| ❌ Playlists se borraban al cerrar sesión | ✅ Playlists persisten |
| ❌ Políticas RLS mal configuradas | ✅ Políticas RLS correctas |
| ❌ Vinculación inestable con auth.uid() | ✅ Vinculación estable con email |
| ❌ CASCADE DELETE borraba datos | ✅ RESTRICT protege datos |
| ❌ Sin selección de cuenta | ✅ Selección de cuenta OAuth |

## 🚀 Siguientes Pasos

1. ✅ Ejecutar `fix-rls-policies.sql` en Supabase
2. ✅ Probar cerrar sesión y volver a iniciar
3. ✅ Verificar que las playlists persisten
4. ✅ Celebrar 🎉

---

**¿Problemas?** Si después de aplicar esta solución sigues teniendo problemas, verifica:

1. Que el script SQL se ejecutó sin errores
2. Que RLS está habilitado en las tablas
3. Que los usuarios tienen un registro en la tabla `users` con su email correcto
4. Los logs de la consola del navegador para más información


