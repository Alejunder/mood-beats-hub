-- =====================================================
-- FIX: POLÍTICAS RLS PARA EVITAR PÉRDIDA DE PLAYLISTS
-- =====================================================
-- Este archivo contiene los comandos SQL necesarios para
-- arreglar las políticas de seguridad de Supabase y evitar
-- que las playlists se eliminen al cerrar sesión.
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este código
-- 4. Ejecuta (Run)
-- =====================================================

-- =====================================================
-- PASO 1: VERIFICAR TABLA USERS
-- =====================================================

-- Asegurarse de que la tabla users NO tenga CASCADE DELETE
-- Si la tabla ya existe, primero eliminar las FK antiguas
ALTER TABLE IF EXISTS spotify_playlists 
DROP CONSTRAINT IF EXISTS spotify_playlists_user_id_fkey;

-- Agregar la FK de nuevo pero SIN CASCADE DELETE
ALTER TABLE spotify_playlists
ADD CONSTRAINT spotify_playlists_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE RESTRICT;  -- RESTRICT previene borrar usuarios que tengan playlists

-- =====================================================
-- PASO 2: HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotify_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 3: CREAR POLÍTICAS RLS CORRECTAS
-- =====================================================

-- ========== POLÍTICAS PARA TABLA USERS ==========

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden ver su propia información" ON users;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propia información" ON users;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propia información" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- PERMITIR SELECT: Los usuarios pueden ver su propia información
CREATE POLICY "users_select_policy" ON users
FOR SELECT
USING (auth.uid()::text = id OR email = auth.jwt()->>'email');

-- PERMITIR INSERT: Los usuarios pueden crear su propio registro
CREATE POLICY "users_insert_policy" ON users
FOR INSERT
WITH CHECK (email = auth.jwt()->>'email');

-- PERMITIR UPDATE: Los usuarios pueden actualizar su propia información
CREATE POLICY "users_update_policy" ON users
FOR UPDATE
USING (auth.uid()::text = id OR email = auth.jwt()->>'email')
WITH CHECK (auth.uid()::text = id OR email = auth.jwt()->>'email');

-- ========== POLÍTICAS PARA TABLA SPOTIFY_PLAYLISTS ==========

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias playlists" ON spotify_playlists;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias playlists" ON spotify_playlists;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias playlists" ON spotify_playlists;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus propias playlists" ON spotify_playlists;
DROP POLICY IF EXISTS "playlists_select_policy" ON spotify_playlists;
DROP POLICY IF EXISTS "playlists_insert_policy" ON spotify_playlists;
DROP POLICY IF EXISTS "playlists_update_policy" ON spotify_playlists;
DROP POLICY IF EXISTS "playlists_delete_policy" ON spotify_playlists;

-- PERMITIR SELECT: Los usuarios pueden ver SOLO sus propias playlists
-- ⚠️ IMPORTANTE: Esta política PERSISTE después de cerrar sesión
CREATE POLICY "playlists_select_policy" ON spotify_playlists
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE email = auth.jwt()->>'email' OR id = auth.uid()::text
  )
);

-- PERMITIR INSERT: Los usuarios pueden crear sus propias playlists
CREATE POLICY "playlists_insert_policy" ON spotify_playlists
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE email = auth.jwt()->>'email' OR id = auth.uid()::text
  )
);

-- PERMITIR UPDATE: Los usuarios pueden actualizar SOLO sus propias playlists
CREATE POLICY "playlists_update_policy" ON spotify_playlists
FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM users WHERE email = auth.jwt()->>'email' OR id = auth.uid()::text
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE email = auth.jwt()->>'email' OR id = auth.uid()::text
  )
);

-- PERMITIR DELETE: Los usuarios pueden eliminar SOLO sus propias playlists
CREATE POLICY "playlists_delete_policy" ON spotify_playlists
FOR DELETE
USING (
  user_id IN (
    SELECT id FROM users WHERE email = auth.jwt()->>'email' OR id = auth.uid()::text
  )
);

-- ========== POLÍTICAS PARA TABLA MOODS ==========

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "moods_select_policy" ON moods;

-- PERMITIR SELECT: Todos pueden leer los moods (son datos públicos)
CREATE POLICY "moods_select_policy" ON moods
FOR SELECT
USING (true);

-- =====================================================
-- PASO 4: CREAR ÍNDICES PARA MEJORAR PERFORMANCE
-- =====================================================

-- Índice para búsquedas por email en users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Índice para búsquedas por user_id en spotify_playlists
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON spotify_playlists(user_id);

-- Índice para búsquedas por is_favorite
CREATE INDEX IF NOT EXISTS idx_playlists_favorite ON spotify_playlists(user_id, is_favorite);

-- =====================================================
-- PASO 5: VERIFICAR QUE TODO FUNCIONE
-- =====================================================

-- Ejecutar este query para verificar las políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'spotify_playlists', 'moods')
ORDER BY tablename, policyname;

-- =====================================================
-- 🎉 ¡LISTO!
-- =====================================================
-- Ahora las playlists se mantendrán guardadas después
-- de cerrar sesión y volver a iniciar sesión.
--
-- IMPORTANTE:
-- - Las playlists se vinculan al EMAIL del usuario, no al auth.uid()
-- - Esto permite que persistan entre sesiones
-- - Solo el dueño de cada playlist puede verla/modificarla/eliminarla
-- =====================================================


