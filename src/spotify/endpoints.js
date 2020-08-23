export const endpoints = {
    base_url: { url: "https://api.spotify.com/v1" },
    active_devices: {
        url: "https://api.spotify.com/v1/me/player/devices",
        method: "get",
    },
    current_track: {
        url: "https://api.spotify.com/v1/me/player/currently-playing",
        method: "get",
    },
    refresh_token: { url: "https://accounts.spotify.com/api/token" },
    resume_playback: { url: "https://api.spotify.com/v1/me/player/play" },
    pause_playback: { url: "https://api.spotify.com/v1/me/player/pause" },
    shuffle_playback: { url: "https://api.spotify.com/v1/me/player/shuffle" },
    repeat_playback: {
        url: "https://api.spotify.com/v1/me/player/repeat",
        method: "put",
        params: [
            {
                name: "state",
                optional: false,
                valid_values: "",
                desc: "Toggle Repeat",
            },
        ],
    },
    seek_playback: {
        url: "https://api.spotify.com/v1/me/player/seek",
        method: "put",
        params: [
            {
                name: "position_ms",
                desc: "Position of the song in milliseconds",
            },
        ],
    },
};
