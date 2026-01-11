import { SelectMoodTemplate } from "../components/templates/GenPlaylistTemplate";

export function SelectMood({ spotifyAccessToken, tokensLoading }) {
  return (
    <SelectMoodTemplate
      spotifyAccessToken={spotifyAccessToken}
      tokensLoading={tokensLoading}
    />
  );
}