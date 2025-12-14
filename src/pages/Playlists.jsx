import { PlaylistsTemplate } from "../components/templates/PlaylistsTemplate";

export function Playlists({ spotifyAccessToken, tokensLoading, onPlayPlaylist }) {
  return (
    <PlaylistsTemplate 
      spotifyAccessToken={spotifyAccessToken}
      tokensLoading={tokensLoading}
      onPlayPlaylist={onPlayPlaylist}
    />
  );
}