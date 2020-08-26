export interface SpotifyInfo {
    spotifyAccessToken: string;
    spotifyRefreshToken: string;
}

export interface PlatformInfo {
    type: number;
    discordUserId?: string;
    discordServerId?: string;
    telegramUserId?: string;
    telegramGroupId?: string;
}

export interface MethodStatus {
    done: boolean | undefined;
    message?: string | undefined;
    error?: any;
    data?: any;
    rawData?: any;
}
