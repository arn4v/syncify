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

export interface SessionInfo {
    id: string | undefined;
    platform: number | undefined;
    groupId: string | undefined;
    members?: string[];
}

export interface UserInfo {
    id?: string;
    exists?: boolean;
    inSession?: boolean;
    sessionInfo?: SessionInfo;
}
