import { ORMHelper } from "./orm_helper";
import { PlatformInfo } from "../interfaces/interfaces";

// TODO: Assign types of databases a number. For example:
// 1: Firebase
// 2: TypeORM supported databases
// Etc
// TODO: Add functions for more databases in separate files

export class DataHelper {
    constructor() {}

    public static addUser(
        spotifyAccessToken: string,
        spotifyRefreshToken: string,
        platformInfo: PlatformInfo
    ) {
        ORMHelper.addUser(
            (spotifyAccessToken = spotifyAccessToken),
            (spotifyRefreshToken = spotifyRefreshToken),
            (platformInfo = platformInfo)
        );
    }

    public static fetchSpotifyTokens(platformInfo: PlatformInfo) {
        return ORMHelper.fetchSpotifyTokens(platformInfo);
    }

    public static updateSpotifyAccessToken(
        accessToken: string,
        platformInfo: PlatformInfo
    ) {
        ORMHelper.updateSpotifyTokens(accessToken, platformInfo);
    }

    public static createSession(platformInfo: PlatformInfo) {
        return ORMHelper.createSession(platformInfo);
    }

    public static joinSession(platformInfo: PlatformInfo) {
        return ORMHelper.joinSession(platformInfo);
    }

    public static leaveSession(platformInfo: PlatformInfo) {
        return ORMHelper.leaveSession(platformInfo);
    }

    public static doesUserExist(platformInfo: PlatformInfo) {
        return ORMHelper.doesUserExist(platformInfo);
    }

    public static doesSessionExist(platformInfo: PlatformInfo) {
        return ORMHelper.doesSessionExist(platformInfo);
    }

    public static updatePlayInstantStatus(platformInfo: PlatformInfo) {
        return ORMHelper.updatePlayInstantStatus(platformInfo);
    }
}
