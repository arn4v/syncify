import { ORMHelper } from "./orm_helper";

// TODO: Assign types of databases a number. For example:
// 1: Firebase
// 2: TypeORM supported databases
// Etc
// TODO: Add functions for more databases in separate files

export class DataHelper {
    constructor() {}

    /**
     * @param  {string} spotifyAccessToken
     * @param  {string} spotifyRefreshToken
     * @param  {any} platformInfo
     */
    public static addUser(
        spotifyAccessToken: string,
        spotifyRefreshToken: string,
        platformInfo: any
    ) {
        ORMHelper.addUser(
            (spotifyAccessToken = spotifyAccessToken),
            (spotifyRefreshToken = spotifyRefreshToken),
            (platformInfo = platformInfo)
        );
    }

    public static fetchSpotifyTokens(platformInfo: any) {
        return ORMHelper.fetchSpotifyTokens(platformInfo);
    }

    public static updateSpotifyAccessToken(
        accessToken: string,
        platformInfo: any
    ) {
        ORMHelper.updateSpotifyTokens(accessToken, platformInfo);
    }

    public static createSession(platformInfo: any) {
        return ORMHelper.createSession(platformInfo);
    }

    public static joinSession(platformInfo: any) {
        return ORMHelper.joinSession(platformInfo);
    }
}
