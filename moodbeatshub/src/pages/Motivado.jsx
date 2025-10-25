import { MotivadoTemplate } from "../components/templates/MotivadoTemplate";

export function Motivado({ spotifyAccessToken, tokensLoading }) {
  return (
    <MotivadoTemplate 
      spotifyAccessToken={spotifyAccessToken}
      tokensLoading={tokensLoading}
    />
  );
}