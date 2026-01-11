import { PerfilTemplate } from "../components/templates/PerfilTemplate";

export function Perfil({ spotifyAccessToken, tokensLoading }) {
  return (
    <PerfilTemplate 
      spotifyAccessToken={spotifyAccessToken}
      tokensLoading={tokensLoading}
    />
  );
}