
import { PlatformInfo, SpotifyInfo } from "../interfaces/global";
import { ShuffleRepeatState } from "../interfaces/spotify";
import { nextPreviousTrackRequest, trackInfoRequest } from "./requests/track_request";
import { playTrack } from "./requests/play";
import { queueRequest } from "./requests/queue";
import { refreshAccessToken } from "./requests/refresh_tokens";
import { seekRequest } from "./requests/seek";
import { togglePlaybackRequest } from "./requests/playback";
import { toggleShuffleRepeatRequest } from "./requests/shuffle_repeat";
import { playlistAlbumItemsRequest } from './requests/playlist_album'

export class RequestsHandler {
    static nextPreviousTrack(
        platformInfo: PlatformInfo,
        requestType: number
    ) {
        return nextPreviousTrackRequest(platformInfo, requestType);
    }

    static togglePlayback(platformInfo: PlatformInfo, spotifyInfo: SpotifyInfo, requestType: number) {
        return togglePlaybackRequest(platformInfo, spotifyInfo, requestType);
    }

    static trackInfo(platformInfo: PlatformInfo, spotifyInfo: SpotifyInfo) {
        return trackInfoRequest(platformInfo, spotifyInfo)
    }

    static seek(platformInfo: PlatformInfo, spotifyInfo: SpotifyInfo, position_ms: number) {
        return seekRequest(platformInfo, spotifyInfo, position_ms)
    }

    static toggleShuffleRepeat(requestType: number, toggleState: ShuffleRepeatState, spotifyInfo: SpotifyInfo) {
        return toggleShuffleRepeatRequest(requestType, toggleState, spotifyInfo)
    }

    static refreshAccessToken(refreshToken: string) {
        return refreshAccessToken(refreshToken)
    }
    static playTrack(platformInfo: PlatformInfo, tracks: string[]) {
        return playTrack(platformInfo, tracks)
    }
    static queue(platformInfo: PlatformInfo, trackUri: string) {
        return queueRequest(platformInfo, trackUri)
    }

    static getAlbumItems(platformInfo: PlatformInfo, spotifyInfo: SpotifyInfo, uri: string) {
        return playlistAlbumItemsRequest(platformInfo, spotifyInfo, 1, uri)
    }

    static getPlaylistItems(platformInfo: PlatformInfo, spotifyInfo: SpotifyInfo, uri: string) {
        return playlistAlbumItemsRequest(platformInfo, spotifyInfo, 2, uri)
    }

}
