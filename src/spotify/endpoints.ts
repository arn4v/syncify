import { ShuffleRepeatState } from "../interfaces/interfaces";

module.exports = {
    play_track: {
        url: "https://api.spotify.com/v1/me/player/play",
        method: "put",
        custom_header: {
            "Content-Type": "application/json",
        },
        data: (tracks: string[]) => {
            return {
                uris: tracks,
            };
        },
        success_status: [204],
        return_data: false,
    },
    add_to_queue: {
        url: "https://api.spotify.com/v1/me/player/queue",
        method: "post",
        success_status: [204],
        params: (uri: string) => {
            return {
                uri: uri,
            };
        },
        return_data: false,
    },
    active_devices: {
        url: "https://api.spotify.com/v1/me/player/devices",
        method: "get",
        return_data: true,
    },
    current_track: {
        url: "https://api.spotify.com/v1/me/player/currently-playing",
        method: "get",
        success_status: [200, 201],
        return_data: true,
    },
    next_track: {
        url: "https://api.spotify.com/v1/me/player/next",
        method: "post",
        success_status: [204],
        return_data: false,
    },
    previous_track: {
        url: "https://api.spotify.com/v1/me/player/previous",
        method: "post",
        success_status: [204],
        return_data: false,
    },
    refresh_token: {
        url: "https://accounts.spotify.com/api/token",
        method: "post",
        params: (refresh_token: string) => {
            return {
                grant_type: "refresh_token",
                refresh_token: refresh_token,
            };
        },

        data: (refresh_token: string) => {
            return {
                grant_type: "refresh_token",
                refresh_token: refresh_token,
            };
        },
        success_status: [200],
        return_data: true,
    },
    resume_playback: {
        url: "https://api.spotify.com/v1/me/player/play",
        method: "put",
        success_status: [204],
        return_data: false,
    },
    pause_playback: {
        url: "https://api.spotify.com/v1/me/player/pause",
        method: "put",
        success_status: [204],
        return_data: false,
    },
    shuffle_playback: {
        url: "https://api.spotify.com/v1/me/player/shuffle",
        method: "put",
        params: (state: ShuffleRepeatState) => {
            return {
                state: state,
            };
        },
        success_status: [200, 201, 204],
        return_data: false,
    },
    repeat_playback: {
        url: "https://api.spotify.com/v1/me/player/repeat",
        method: "put",
        params: (state: ShuffleRepeatState) => {
            return {
                state: state,
            };
        },
        success_status: [200, 201, 204],
        return_data: false,
    },
    seek_playback: {
        url: "https://api.spotify.com/v1/me/player/seek",
        method: "put",
        params: (position_ms: number | undefined) => {
            return {
                position_ms: position_ms,
            };
        },
        success_status: [204],
        return_data: false,
    },
    // search: {
    //     url: "https://api.spotify.com/v1/search",
    //     method: "get",
    //     params: [{ name: "q" }, { name: "type" }, { name: "limit" }],
    //     return_data: true,
    // },
};
