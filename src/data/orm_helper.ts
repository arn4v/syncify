import { createConnection, getConnection } from "typeorm";
import { User } from "./typeorm/entity/user.entity";

export class ORMHelper {
    private static _connection: any;
    private _instance: ORMHelper;

    constructor() {
        if (this._instance != null) return this._instance;
        this._instance = this;
        return this._instance;
    }

    /**
     * @returns Promise
     */
    public static async connection() {
        if (this._connection != null) return this._connection;
        this._connection = this.databaseConnection();
        return this._connection;
    }

    /**
     * @returns Promise
     */
    private static async databaseConnection() {
        return await createConnection();
    }

    /**
     * @param  {string} spotifyAccessToken
     * @param  {string} spotifyRefreshToken
     * @param  {any} platformInfo
     * @returns any
     */
    public static addUser(
        spotifyAccessToken: string,
        spotifyRefreshToken: string,
        platformInfo: any
    ) {
        let connection = getConnection();
        let discordUserId: string | undefined =
            platformInfo.discordUserId || undefined;
        let telegramUserId: string | undefined =
            platformInfo.telegramUserId || undefined;
        let addUser = async () => {
            let user: any = new User();
            let platform: number = platformInfo.platformType;

            if ((platform = 1)) {
                user.discordUserId = discordUserId;
            } else if (platform == 2) {
                user.telegramUserId = telegramUserId;
            }

            user.spotifyAccessToken = spotifyAccessToken;
            user.spotifyRefreshToken = spotifyRefreshToken;

            await connection.manager.save(user).then((user: any) => {
                console.log(
                    `LOG: User ${user.syncifyUserId} successfully created`
                );
            });
        };

        connection
            .getRepository(User)
            .findOne({ where: { discordUserId: discordUserId } })
            // @ts-expect-error
            .then((data: object) => {
                if (data == undefined) {
                    addUser();
                } else {
                    console.log(
                        `LOG: OrmHelper: addUser: User ${discordUserId} already exists...`
                    );
                }
            })
            .catch((error: string) => {
                `LOG: OrmHelper: findOne catch block: Error: ${error}`;
            });
    }

    public static async fetchSpotifyTokens(platformInfo: any) {
        let discordUserId: string | undefined =
            platformInfo.discordUserId || undefined;
        let telegramUserId: string | undefined =
            platformInfo.telegramUserId || undefined;
        let connection: any = getConnection();
        let data = async () => {
            let spotifyInfo = {
                spotifyAccessToken: undefined,
                spotifyRefreshToken: undefined,
            };
            await connection
                .getRepository(User)
                .findOne({
                    where:
                        platformInfo.platformType == 1
                            ? { discordUserId: discordUserId }
                            : { telegramUserId: telegramUserId },
                })
                .then((data: object) => {
                    // TODO: Find a way to not use ts-ignore and still be
                    // able access the object
                    // @ts-ignore
                    spotifyInfo.spotifyAccessToken = data.spotifyAccessToken;
                    // @ts-ignore
                    spotifyInfo.spotifyRefreshToken = data.spotifyRefreshToken;
                })
                .catch((error: string) => {
                    console.log(
                        `LOG: ORMHelper -> fetchSpotifyTokens: ${error}`
                    );
                });
            return spotifyInfo;
        };
        return data;
    }

    public static async updateSpotifyTokens(
        accessToken: string,
        platformInfo: any
    ) {
        let discordUserId: string | undefined =
            platformInfo.discordUserId || undefined;
        let telegramUserId: string | undefined =
            platformInfo.telegramUserId || undefined;
        let userLogMessage =
            platformInfo.platformType == 1
                ? "Discord user" + discordUserId
                : "Telegram user" + telegramUserId;
        let connection: any = getConnection();
        connection
            .then(async (connection: any) => {
                let userRepo = connection.getRepository(User);
                let user = userRepo.findOne({
                    where:
                        platformInfo.platformType == 1
                            ? { discordUserId: discordUserId }
                            : { telegramUserId: telegramUserId },
                });
                user.spotifyAccessToken = accessToken;
                await userRepo.save(user);
                console.log(
                    `LOG: ORMHelper: updateSpotifyTokens: successfully updated access token for user ${userLogMessage}`
                );
            })
            .catch((error: string) =>
                console.log(
                    `LOG: ORMHelper: updateSpotifyTokens: Error updating token: ${error}`
                )
            );
    }

    // public static registerGroup(platformInfo: any) {}
}
