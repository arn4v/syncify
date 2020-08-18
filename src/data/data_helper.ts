import { ORMHelper } from "./orm_helper";

// TODO: Assign types of databases a number. For example:
// 1: Firebase
// 2: TypeORM supported databases
// Etc
// TODO: Add functions for more databases in separate files

/**
 * @param  {Object} data
 * @param  {string|undefined=undefined} location
 * @param  {string|undefined=undefined} firebaseLocation
 */
export default class DataHelper {
    // private static databaseType =
    //     process.env["DATABASE_TYPE"] != undefined
    //         ? parseInt(process.env["DATABASE_TYPE"] as string)
    //         : 1;

    constructor() {}

    // public static updateDatabase(data: any, firebaseLocation: any = undefined) {
    //     // if (this.databaseType == 1) {
    //     //     firebaseLocation != undefined
    //     //         ? FirebaseHelper.updateFirebase(
    //     //               (data = data),
    //     //               (location = firebaseLocation)
    //     //           )
    //     //         : FirebaseHelper.updateFirebase((data = data));
    //     // }
    // }

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
        console.log(platformInfo);
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
}
