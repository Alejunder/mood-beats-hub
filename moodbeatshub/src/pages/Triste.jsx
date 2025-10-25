import { TristeTemplate } from "../components/templates/TristeTemplate";

export function Triste({ spotifyAccessToken, tokensLoading }) {
  return (
    <TristeTemplate 
      spotifyAccessToken={spotifyAccessToken}
      tokensLoading={tokensLoading}
    />
  );
}