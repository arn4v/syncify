import { Session } from "./typeorm/entity/session.entity";
import { MethodStatus, SpotifyInfo, PlatformInfo } from "../interfaces/global";
import { User } from "./typeorm/entity/user.entity";
import { createConnection, getConnection, Connection } from "typeorm";

interface DeleteSessionParameters {
    onStart?: boolean;
    onCronJob?: boolean;
}

export class ORMHelper {
    private static _connection: any;

    /**
     * @returns Promise
     */
    public static async connection(): Promise<Connection> {
        if (this._connection != null) return this._connection;
        this._connection = this.databaseConnection();
        return this._connection;
    }

    /**
     * @returns Promise
     */
    private static async databaseConnection(): Promise<Connection> {
        return await createConnection();
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
        platformInfo: PlatformInfo
    ) {
        let connection = getConnection();
        const platform = platformInfo.type;
        const userId =
            platform == 1
                ? platformInfo.discordUserId
                : platformInfo.telegramUserId;
        let addUser = async () => {
            let user: any = new User();

            if (platform == 1) {
                user.discordUserId = userId;
            } else if (platform == 2) {
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
                    platform == 1
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
        platformInfo: PlatformInfo
    ): Promise<MethodStatus> {
        let connection: Connection = getConnection();
        let platform = platformInfo.type;
        let userId =
            platform == 1
                ? platformInfo.discordUserId
                : platformInfo.telegramUserId;
        let status: MethodStatus = {
            done: undefined,
        };

        await connection
            .getRepository(User)
            .findOne({
                where:
                    platform == 1
                        ? { discordUserId: userId }
                        : { telegramUserId: userId },
            })
            .then((data?: object) => {
                if (data == undefined) {
                    status.done = false;
                } else {
                    status.done = true;
                }
            })
            .catch(console.error);
        return status;
    }

    public static async fetchSpotifyTokens(
        platformInfo: PlatformInfo
    ): Promise<SpotifyInfo> {
        const platform = platformInfo.type;
        const userId =
            platform == 1
                ? platformInfo.discordUserId
                : platformInfo.telegramUserId;
        let connection: Connection = getConnection();
        let spotifyInfo: SpotifyInfo = Object();

        await connection
            .getRepository(User)
            .findOne({
                where:
                    platform == 1
                        ? { discordUserId: userId }
                        : { telegramUserId: userId },
            })
            .then((user: any) => {
                spotifyInfo.spotifyAccessToken = user.spotifyAccessToken;
                spotifyInfo.spotifyRefreshToken = user.spotifyRefreshToken;
            })
            .catch((error: string) => {
                console.log(`LOG: ORMHelper -> fetchSpotifyTokens: ${error}`);
            });
        return spotifyInfo;
    }

    public static async updateSpotifyTokens(
        newAccessToken: string,
        platformInfo: PlatformInfo
    ) {
        const platform: number = platformInfo.type;
        const userId: string = (platform == 1
            ? platformInfo.discordUserId
            : platformInfo.telegramUserId) as string;

        let connection = getConnection();

        await connection
            .getRepository(User)
            .findOne({
                where:
                    platform == 1
                        ? { discordUserId: userId }
                        : { telegramUserId: userId },
            })
            .then(async (user: any) => {
                user.spotifyAccessToken = newAccessToken;
                await connection.manager.save(user).then((user?: User) => {
                    console.log(
                        // @ts-ignore
                        `LOG: ORMHelper: updateSpotifyTokens: successfully updated access token for user ${user?.syncifyUserId}`
                    );
                });
            });
    }

    public static async createSession(platformInfo: PlatformInfo) {
        let connection = getConnection();

        const platform: number = platformInfo.type;
        const userId: string = (platform == 1
            ? platformInfo.discordUserId
            : platformInfo.telegramUserId) as string;

        let createSession = async () => {
            let _status: MethodStatus = {
                done: undefined,
                message: undefined,
                data: undefined,
            };
            let session = new Session();
            session.platform = platform;
            session.platformGroupId = (platform == 1
                ? platformInfo.discordServerId
                : platformInfo.telegramGroupId) as string;
            session.createdBy = userId;
            session.members = JSON.stringify([userId]);
            session.admins = JSON.stringify([userId]);
            session.playInstant = true;

            //
            // ALWAYS USE AWAIT WITH WHEN CONNECTION IS BEING FETCHED USING
            // getConnection()
            //
            await connection.manager
                .save(session)
                .then(async (_session) => {
                    _status.done = true;
                    _status.message = "Created session";
                    _status.data = { sessionId: _session.sessionId };
                })
                .catch((error: object) => {
                    _status.done = false;
                    _status.message = "Error creating message session";
                    console.log("ERROR: ORMHelper.createsession: ", error);
                });
            return _status;
        };

        let status: MethodStatus = {
            done: undefined,
            message: undefined,
        };

        await this.doesUserExist(platformInfo)
            .then(async (status: MethodStatus) => {
                if (status.done) {
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
                        .then(async (data: any) => {
                            if (data == undefined) {
                                await createSession()
                                    .then((_status: MethodStatus) => {
                                        console.log(_status);
                                        if (_status.done == true) {
                                            console.log(_status);
                                            status = _status;
                                        }
                                        console.log(
                                            `Successfully created session ${status.data.sessionId}`
                                        );
                                    })
                                    .catch((error) =>
                                        console.log(
                                            `ERROR: ORMHelper.createSession: ${error}`
                                        )
                                    );
                            } else {
                                status.done = false;
                                status.message =
                                    "A session already exists here";
                                console.log(
                                    `LOG: createSession: A session already exists in this server/group`
                                );
                            }
                        })
                        .catch((error: object) => {
                            console.log("ERROR: createSession: ", error);
                            status.done = false;
                            status.message = "Unable to create session";
                            // createSession();
                        });
                } else {
                    status.done = false;
                    status.message = "Please register first.";
                }
            })
            .catch(() => {
                status.done = false;
                status.message = "Please register first";
            });
        return status;
    }

    public static async joinSession(
        platformInfo: PlatformInfo
    ): Promise<MethodStatus> {
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
        let status: MethodStatus = {
            done: undefined,
            message: undefined,
        };

        await connection
            .getRepository(Session)
            .findOne({
                where: {
                    platformGroupId: groupId,
                },
            })
            .then(async (session?: object) => {
                await this.doesUserExist(platformInfo)
                    .then(async (res) => {
                        if (res) {
                            // @ts-expect-error
                            let members = JSON.parse(session.members);
                            if (!members.includes(userId)) {
                                members.push(userId);
                                // @ts-expect-error
                                session.members = JSON.stringify(members);
                                await connection.manager
                                    .save(session)
                                    .then((_session: any) => {
                                        status.done = true;
                                        status.message = `Added user ${userId} session ${_session.sessionId}`;
                                    })
                                    .catch((error: object) =>
                                        console.log(
                                            `ERROR: joinSession: L263 unable to save sessions`,
                                            error
                                        )
                                    );
                            } else {
                                status.done = false;
                                status.message =
                                    "You are already a part of this session";
                            }
                        } else {
                            status.done = false;
                            status.message =
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
        return status;
    }

    public static async doesSessionExist(
        platformInfo: PlatformInfo
    ): Promise<MethodStatus> {
        let connection = getConnection();
        const platform: number = platformInfo.type;
        const groupId: string | undefined =
            platform == 1
                ? platformInfo.discordServerId
                : platformInfo.telegramGroupId;

        let status: MethodStatus = {
            done: undefined,
            message: undefined,
            data: undefined,
        };
        let exists: string = "Session already exists in this group/server";
        let doesNotExist: string = "Please create a session first";

        await connection
            .getRepository(Session)
            .findOne({
                where: {
                    platformGroupId: groupId,
                },
            })
            .then((session) => {
                if (typeof session != "undefined") {
                    status.done = true;
                    status.message = exists;
                    status.data = session;
                } else {
                    status.done = false;
                    status.message = doesNotExist;
                }
            })
            .catch((error) => {
                if (error != null) status.done = false;
            });
        return status;
    }

    public static async updatePlayInstantStatus(platformInfo: PlatformInfo) {
        let connection: Connection = getConnection();
        const platform: number = platformInfo.type;
        const groupId: string | undefined =
            platform == 1
                ? platformInfo.discordServerId
                : platformInfo.telegramGroupId;
        let status: any = {
            done: undefined,
            message: undefined,
        };
        await connection
            .getRepository(Session)
            .findOne({ where: { platformGroupId: groupId } })
            .then(async (session: any) => {
                session.playInstant =
                    session.playInstant == true ? false : true;
                connection.manager.save(session).then(() => {
                    status.done = true;
                    status.message = "Updated status";
                });
            })
            .catch((error: string) => {
                status.done = false;
                status.message = "Unable to update status";
                console.log(`ERROR: updatePlayInstanceStatus:391: ${error}`);
            });
        return status;
    }

    public static async addToSessionQueue(
        platformInfo: PlatformInfo,
        trackUri: string
    ) {
        let connection: Connection = getConnection();
        const platform: number = platformInfo.type;
        const groupId: string | undefined =
            platform == 1
                ? platformInfo.discordServerId
                : platformInfo.telegramGroupId;
        let status: MethodStatus = Object();
        if (trackUri.length <= 36) {
            await connection
                .getRepository(Session)
                .findOne({ where: { platformGroupId: groupId } })
                .then(async (session: any) => {
                    let queue = JSON.parse(session.queue);
                    queue.push(trackUri);
                    session.queue = JSON.stringify(queue);
                    await connection.manager
                        .save(session)
                        .then((session: any) => {
                            status.done = true;
                            status.message = "Added song to queue";
                            status.data = { queue: session.queue };
                        })
                        .catch((error) => {
                            console.log(
                                `ERROR: ORMHelper: addToSessionQueue: manager.save catchBlock: ${error}`
                            );
                            status.done = false;
                            status.message = "Unable to save edited queue";
                        });
                })
                .catch((error: string) =>
                    console.log(`ERROR: ORMHelper: addToSessionQueue: ${error}`)
                );
        } else {
            status.done = false;
            status.message = "Passed URI less than 22 characters";
        }
        // @ts-ignore
        return status;
    }

    static async deleteSessions({
        onStart,
        onCronJob,
    }: DeleteSessionParameters) {
        let connection: Connection = await this.connection();
        let sessionRepository = connection.getRepository(Session);
        let status: any = {
            done: undefined,
            message: undefined,
        };

        sessionRepository
            .find()
            .then((sessions: any) => {
                sessions.forEach((session: any) => {
                    if (onStart) {
                        connection
                            .createQueryBuilder()
                            .delete()
                            .from(Session)
                            .where("sessionId = :sessionId", {
                                sessionId: session.sessionId,
                            })
                            .execute();
                    } else if (onCronJob) {
                        if (session.updatedOn) {
                        }
                    }
                });
            })
            .catch((error) => {
                console.log(error);
            });
        // connection
        //     .getRepository(Session)
        //     .remove([])
        //     .then(() => {
        //         status.done = true;
        //         status.message = "Deleted all entries in Session table.";
        //         console.log(status.message);
        //     })
        //     .catch((error: string) => {
        //         status.done = false;
        //         status.message = error;
        //         console.log(status.message);
        //     });
        return status;
    }
}
