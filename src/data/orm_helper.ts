import { createConnection, getConnection } from "typeorm";
import { User } from "./typeorm/entity/user.entity";

// const connectionConfig: Object = (): Object => {
//     let databaseType: number = parseInt(process.env["DATABASE_TYPE"] as string);
//     if (databaseType == 2) {
//         return {
//             type: "sqlite",
//             database: path.join(path.resolve(__dirname), "../syncify.db"),
//         };
//     }
// };

// interface User {
//     id: number;
//     syncifyUserId: string;
//     discordUserId: string;
//     spotifyAccessToken: string;
//     spotifyRefreshToken: string;
//     createdAt: string;
// }

const connection = async () => {
    return createConnection();
};

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
        let discordUserId: string | undefined =
            platformInfo.discordUserId || undefined;
        let telegramUserId: string | undefined =
            platformInfo.telegramUserId || undefined;
        let addUser = async (connection: any) => {
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
            connection
                .getRepository(User)
                .findOne({ where: { discordUserId: discordUserId } })
                .then((data: object) => {
                    if (data == undefined) {
                        addUser(connection);
                    } else {
                        console.log(
                            `LOG: OrmHelper: addUser: User ${discordUserId} already exists...`
                        );
                    }
                })
                .catch((error: string) => {
                    `LOG: OrmHelper: findOne catch block: Error: ${error}`;
                });
        };
        addUser(connection());
    }

    public static async fetchSpotifyTokens(platformInfo: any) {
        let discordUserId: string | undefined =
            platformInfo.discordUserId || undefined;
        let telegramUserId: string | undefined =
            platformInfo.telegramUserId || undefined;
        let spotifyInfo = {
            spotifyAccessToken: undefined,
            spotifyRefreshToken: undefined,
        };
        var connection: any = connection;
        async function getData() {
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
                    return spotifyInfo;
                })
                .catch((error: string) => {
                    console.log(
                        `LOG: ORMHelper -> fetchSpotifyTokens: ${error}`
                    );
                });
        }
        getData().then(() => console.log("Done"));
        return spotifyInfo;
    }

    // public static registerGroup(platformInfo: any) {}
}
