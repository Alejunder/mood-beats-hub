import { FelizTemplate } from "../components/templates/FelizTemplate";

export function Feliz({ spotifyAccessToken, tokensLoading }) {
  return (
    <FelizTemplate 
      spotifyAccessToken={spotifyAccessToken}
      tokensLoading={tokensLoading}
    />
  );
}