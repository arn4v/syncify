import { createConnection } from "typeorm";
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
    public static async connection(): Promise<any> {
        if (this._connection != null) return this._connection;
        this._connection = this.databaseConnection();
        return this._connection;
    }

    /**
     * @returns Promise
     */
    private static async databaseConnection(): Promise<any> {
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
    ): any {
        let connection: any = this.connection();
        let user: any = new User();
        let platform: number = platformInfo.platformType;

        if ((platform = 1)) {
            user.discordUserId = parseInt(platformInfo.discordUserId);
        } else if (platform == 2) {
            user.telegramUserId = parseInt(platformInfo.telegramUserId);
        }

        user.spotifyAccessToken = spotifyAccessToken;
        user.spotifyRefreshToken = spotifyRefreshToken;
        connection.manager.save(user).then((user: any) => {
            console.log(`LOG: User ${user.syncifyUserId} successfully created`);
        });
    }
}
