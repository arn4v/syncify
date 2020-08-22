import path from "path";
import { Session } from "./typeorm/entity/session.entity";
import { User } from "./typeorm/entity/user.entity";
import { createConnection, getConnection, Connection } from "typeorm";

export class ORMHelper {
    private static _connection: any;

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
        return await createConnection({
            type: "sqlite",
            database: path.resolve(__dirname, "syncify.sqlite"),
            synchronize: true,
            entities: [User, Session],
        });
    }

    /**
     * @param  {string} spotifyAccessToken
     * @param  {string} spotifyRefreshToken
     * @param  {any} platformInfo
     * @returns any
     */
    public static async addUser(
        spotifyAccessToken: string,
        spotifyRefreshToken: string,
        platformInfo: any
    ) {
        let connection = getConnection();
        let type = platformInfo.type;
        let userId =
            type == 1
                ? platformInfo.discordUserId
                : platformInfo.telegramUserId;
        let addUser = async () => {
            let user: any = new User();

            if ((type = 1)) {
                user.discordUserId = userId;
            } else if (type == 2) {
                user.telegramUserId = userId;
            }

            user.spotifyAccessToken = spotifyAccessToken;
            user.spotifyRefreshToken = spotifyRefreshToken;

            await connection.manager.save(user).then((user: any) => {
                console.log(
                    `LOG: User ${user.syncifyUserId} successfully created`
                );
            });
        };

        await connection
            .getRepository(User)
            .findOne({
                where:
                    type == 1
                        ? { discordUserId: userId }
                        : { telegramUserId: userId },
            })
            // @ts-expect-error
            .then((data: object) => {
                if (data == undefined) {
                    addUser();
                } else {
                    console.log(
                        `LOG: OrmHelper: addUser: User ${userId} already exists...`
                    );
                }
            })
            .catch((error: string) => {
                `LOG: OrmHelper: findOne catch block: Error: ${error}`;
            });
    }

    public static async doesUserExist(
        type: string,
        userId: string
    ): Promise<boolean> {
        let connection: Connection = getConnection();
        // @ts-ignore
        let result: boolean | undefined = undefined;
        connection
            .getRepository(User)
            .findOne({ where: { discordUserId: userId } })
            .then((data?: object) => {
                console.log(data);
                if (data == undefined) {
                    result = false;
                } else {
                    result = true;
                }
            })
            .catch(console.error);
        // @ts-ignore
        return result;
    }

    public static async fetchSpotifyTokens(platformInfo: any): Promise<any> {
        let type = platformInfo.type;
        let userId =
            type == 1
                ? platformInfo.discordUserId
                : platformInfo.telegramUserId;
        let connection: any = getConnection();
        let spotifyInfo = {
            spotifyAccessToken: undefined,
            spotifyRefreshToken: undefined,
        };
        await connection
            .getRepository(User)
            .findOne({
                where:
                    type == 1
                        ? { discordUserId: userId }
                        : { telegramUserId: userId },
            })
            .then((data?: object) => {
                // TODO: Find a way to not use ts-ignore and still be
                // able access the object
                // @ts-ignore
                spotifyInfo.spotifyAccessToken = data.spotifyAccessToken;
                // @ts-ignore
                spotifyInfo.spotifyRefreshToken = data.spotifyRefreshToken;
                console.log(spotifyInfo);
            })
            .catch((error: string) => {
                console.log(`LOG: ORMHelper -> fetchSpotifyTokens: ${error}`);
            });
        return spotifyInfo;
    }

    public static async updateSpotifyTokens(
        accessToken: string,
        platformInfo: any
    ) {
        let discordUserId: string | undefined =
            platformInfo.discordUserId || undefined;
        let telegramUserId: string | undefined =
            platformInfo.telegramUserId || undefined;
        let connection = getConnection();
        connection
            .getRepository(User)
            .findOne({
                where:
                    platformInfo.platformType == 1
                        ? { discordUserId: discordUserId }
                        : { telegramUserId: telegramUserId },
            })
            .then(async (user?: object) => {
                // @ts-ignore
                user?.spotifyAccessToken = accessToken;

                await connection.manager.save(user).then((user?: object) => {
                    console.log(
                        // @ts-ignore
                        `LOG: ORMHelper: updateSpotifyTokens: successfully updated access token for user ${user?.syncifyUserId}`
                    );
                });
            });
    }

    public static async createSession(platformInfo: any) {
        let connection = getConnection();
        var res;
        let createSession = async () => {
            let session = new Session();
            session.platform = platformInfo.type;
            session.platformGroupId =
                platformInfo.type == 1
                    ? platformInfo.discordServerId
                    : platformInfo.telegramGroupId;
            session.createdBy = platformInfo.userId;
            session.members = JSON.stringify({
                members: [platformInfo.userId],
            });

            let sessionId;

            await connection.manager
                .save(session)
                .then(async () => {
                    res = "Created session";
                    sessionId = session.sessionId;
                    console.log(`Creating session ${sessionId}`);
                })
                .catch((error: object) => {
                    res = "Error creating message session";
                    console.log("ERROR: ORMHelper.createsession: ", error);
                });
        };

        await connection
            .getRepository(Session)
            .findOne({
                where: {
                    platformGroupId:
                        platformInfo.type == 1
                            ? platformInfo.discordServerId
                            : platformInfo.telegramGroupId,
                },
            })
            .then(async (data?: object) => {
                if (data == undefined) {
                    await createSession()
                        .then((sessionId) => {
                            res = "Created session";
                            console.log(
                                `Successfully created session ${sessionId}`
                            );
                        })
                        .catch((error) =>
                            console.log(
                                `ERROR: ORMHelper.createSession: ${error}`
                            )
                        );
                } else {
                    res = "A session already exists here";
                    console.log(
                        `LOG: createSession: A session already exists in this server/group`
                    );
                }
            })
            .catch((error: object) => {
                console.log("ERROR: createSession: ", error);
                res = "unable to create session";
                // createSession();
            });
        return res;
    }

    public static async joinSession(platformInfo: any): Promise<string> {
        let connection: Connection = getConnection();
        const platform = platformInfo.type;
        const userId =
            platform == 1
                ? platformInfo.discordUserId
                : platformInfo.telegramUserId;
        const groupId =
            platformInfo.type == 1
                ? platformInfo.discordServerId
                : platformInfo.telegramGroupId;
        let message: string;
        await connection
            .getRepository(Session)
            .findOne({
                where: {
                    platformGroupId: groupId,
                },
            })
            .then(async (session?: object) => {
                await this.doesUserExist(platform, userId)
                    .then(async (res) => {
                        if (res) {
                            // @ts-expect-error
                            let members = JSON.parse(session.members);
                            console.log(members);
                            console.log(members.members);
                            members.members = members.members.push(userId);
                            // @ts-expect-error
                            session.members = members;
                            await connection.manager
                                .save(session)
                                .then(() => {
                                    message =
                                        "Successfully added " +
                                        userId +
                                        " to the session!";
                                })
                                .catch((error: object) =>
                                    console.log(
                                        `ERROR: joinSession: L263 unable to save sessions`,
                                        error
                                    )
                                );
                        } else {
                            message =
                                "Please register first. Unable to find you in database";
                        }
                    })
                    .catch((error: object) =>
                        console.log(
                            `ERROR: joinSession: doesUserExist Catch Block`,
                            error
                        )
                    );
            })
            .catch((error: object) => {
                console.log(`ERROR: ORMHelper.joinSession: ${error}`);
            });
        // @ts-ignore
        return message;
    }
    // public static registerGroup(platformInfo: any) {}
}
