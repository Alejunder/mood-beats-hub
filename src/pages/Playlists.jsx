import { PlaylistsTemplate } from "../components/templates/PlaylistsTemplate";

export function Playlists({ spotifyAccessToken, tokensLoading }) {
  return (
    <PlaylistsTemplate 
      spotifyAccessToken={spotifyAccessToken}
      tokensLoading={tokensLoading}
    />
  );
}