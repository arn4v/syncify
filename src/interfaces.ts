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

export interface Artist {
    name: string;
    link: string;
    uri: string;
}

export interface Track {
    id: string | undefined;
    name?: string | undefined;
    link?: string | undefined;
    uri: string | undefined;
    artists?: Artist[] | undefined;
    position?: number;
}

export interface PlaylistInfo {
    id: string;
    items: Track[];
}

export interface AlbumInfo extends PlaylistInfo {}

export type ShuffleRepeatState = boolean | "off" | "context" | "track";

export interface MethodStatus {
    done: boolean | undefined;
    message?: string | undefined;
    error?: any;
    data?: any;
    rawData?: any;
}

export interface RequestFuncConfig {
    endpoint_info: EndpointInfo;
    spotify_info: SpotifyInfo;
}

export interface RequestStatus {
    successfull: boolean;
    status: number | undefined;
    response: any | undefined;
    error: any | undefined;
    isRefreshed: boolean | undefined;
    newAccessToken?: string;
    uris?: string[];
    trackInfo?: Track;
}

export interface EndpointInfo {
    url: string;
    method: "get" | "put" | "post";
    success_status: number[];
    return_data?: boolean;
    custom_header?: any;
    data?: any;
    params?: any;
}
