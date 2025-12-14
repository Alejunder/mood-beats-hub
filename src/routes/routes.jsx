import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/Login";
import { Home } from "../pages/Home";
import { Estadoanimo } from "../pages/EstadoAnimo";
import { Playlists } from "../pages/Playlists";
import { Configuracion } from "../pages/Configuracion";
import { Perfil } from "../pages/Perfil";
import { SelectMood } from "../pages/GenPlaylist";
import { ProtectedRoute } from "../hooks/protectedroutes";

export function MyRoutes({ user, spotifyAccessToken, tokensLoading, onPlayPlaylist }) {
  return (
    <Routes>
      {/* Ruta de login - redirige a home si ya está autenticado */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      
      {/* Rutas protegidas - requieren autenticación */}
      <Route element={<ProtectedRoute user={user} redirectTo="/login" />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/animo" element={<Estadoanimo />} />
        <Route 
          path="/playlists-favoritas" 
          element={
            <Playlists 
              spotifyAccessToken={spotifyAccessToken}
              tokensLoading={tokensLoading}
              onPlayPlaylist={onPlayPlaylist}
            />
          } 
        />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route 
          path="/perfil" 
          element={
            <Perfil 
              spotifyAccessToken={spotifyAccessToken}
              tokensLoading={tokensLoading}
            />
          } 
        />
        <Route 
          path="/genplaylist" 
          element={
            <SelectMood
              spotifyAccessToken={spotifyAccessToken} 
              tokensLoading={tokensLoading}
            />
          } 
        />
      </Route>

      {/* Ruta por defecto - redirige según autenticación */}
      <Route 
        path="*" 
        element={<Navigate to={user ? "/" : "/login"} replace />} 
      />
    </Routes>
  );
}