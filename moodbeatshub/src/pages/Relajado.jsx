import { RelajadoTemplate } from "../components/templates/RelajadoTemplate";

export function Relajado({ spotifyAccessToken, tokensLoading }) {
  return (
    <RelajadoTemplate 
      spotifyAccessToken={spotifyAccessToken}
      tokensLoading={tokensLoading}
    />
  );
}