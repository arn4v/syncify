import { SpotifyInfo } from "../interfaces/global";
import { ShuffleRepeatState } from "../interfaces/spotify";
import { nextPreviousTrackRequest } from "./requests/next_previous";
import { playTrackRequest } from "./requests/play";
import { playlistAlbumItemsRequest } from "./requests/playlist_album";
import { queueRequest } from "./requests/queue";
import { refreshAccessToken } from "./requests/refresh_tokens";
import { seekRequest } from "./requests/seek";
import { togglePlaybackRequest } from "./requests/playback";
import { toggleShuffleRepeatRequest } from "./requests/shuffle_repeat";
import { trackInfoRequest } from "./requests/track";

export class RequestsHandler {
    static nextPreviousTrack(spotifyInfo: SpotifyInfo, requestType: 1 | 2) {
        return nextPreviousTrackRequest(spotifyInfo, requestType);
    }

    static togglePlayback(spotifyInfo: SpotifyInfo, requestType: number) {
        return togglePlaybackRequest(spotifyInfo, requestType);
    }

    static trackInfo(spotifyInfo: SpotifyInfo) {
        return trackInfoRequest(spotifyInfo);
    }

    static toggleShuffleRepeat(
        requestType: number,
        toggleState: ShuffleRepeatState,
        spotifyInfo: SpotifyInfo
    ) {
        return toggleShuffleRepeatRequest(
            requestType,
            toggleState,
            spotifyInfo
        );
    }

    static refreshAccessToken(refreshToken: string) {
        return refreshAccessToken(refreshToken);
    }
    static playTrack(spotifyInfo: SpotifyInfo, tracks: string[]) {
        return playTrackRequest(spotifyInfo, tracks);
    }

    static queue(spotifyInfo: SpotifyInfo, trackUri: string) {
        return queueRequest(spotifyInfo, trackUri);
    }

    static getAlbumItems(spotifyInfo: SpotifyInfo, uri: string) {
        return playlistAlbumItemsRequest(spotifyInfo, 1, uri);
    }

    static getPlaylistItems(spotifyInfo: SpotifyInfo, uri: string) {
        return playlistAlbumItemsRequest(spotifyInfo, 2, uri);
    }

    static seek(spotifyInfo: SpotifyInfo, position_ms: number) {
        return seekRequest(spotifyInfo, position_ms);
    }
}
