import { Session } from "./typeorm/entity/session.entity";
import { User } from "./typeorm/entity/user.entity";
import {
    Connection,
    Repository,
    createConnection,
    getConnection,
    getConnectionOptions,
    ConnectionOptions,
} from "typeorm";
import {
    MethodStatus,
    PlatformInfo,
    SessionInfo,
    SpotifyInfo,
    UserInfo,
} from "../interfaces/global";

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
        let options: ConnectionOptions = {
            ...(await getConnectionOptions()),
            entities: [User, Session],
        };
        return await createConnection(options);
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
            .then((user?: User) => {
                if (user == undefined) {
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
    ): Promise<UserInfo> {
        let connection: Connection = getConnection();
        let platform = platformInfo.type;
        let userId =
            platform == 1
                ? platformInfo.discordUserId
                : platformInfo.telegramUserId;

        let userInfo: UserInfo = {};

        await connection
            .getRepository(User)
            .findOne({
                where:
                    platform == 1
                        ? { discordUserId: userId }
                        : { telegramUserId: userId },
            })
            .then(async (user?: User) => {
                if (user !== undefined) {
                    userInfo.exists = true;
                    userInfo.id = user.syncifyUserId;
                    await this.isUserInSession(platformInfo).then(
                        async (res: MethodStatus) => {
                            if (res.done) {
                                userInfo.inSession = true;
                                userInfo.sessionInfo = res.data;
                            } else {
                                userInfo.inSession = false;
                            }
                        }
                    );
                } else {
                    userInfo.exists = false;
                }
            })
            .catch(console.error);
        return userInfo;
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
                .then(async (_session: Session) => {
                    _status.done = true;
                    _status.message = `Created session. Use ${
                        platform == 1
                            ? (process.env.DISCORD_BOT_PREFIX as string) ?? "!"
                            : "/"
                    }session to get more info.`;
                    _status.data = { sessionId: _session.sessionId };
                })
                .catch((error) => {
                    _status.done = false;
                    _status.message = "Error creating message session";
                    console.log("ERROR: ORMHelper.createsession:243 - ", error);
                });
            return _status;
        };

        let status: MethodStatus = {
            done: undefined,
            message: undefined,
        };

        await this.doesUserExist(platformInfo)
            .then(async (userInfo: UserInfo) => {
                if (userInfo.exists) {
                    if (!userInfo.inSession) {
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
                            .then(async (session?: Session) => {
                                if (typeof session == "undefined") {
                                    await createSession()
                                        .then((_status: MethodStatus) => {
                                            if (_status.done == true) {
                                                console.log(
                                                    `Successfully created session ${_status.data.sessionId}`
                                                );
                                            }
                                            status.done = _status.done;
                                            status.message = _status.message;
                                            status.data = _status.data;
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                            console.log(
                                                `ERROR: ORMHelper.createSession: ${error}`
                                            );
                                        });
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
                        status.message = "You're already in a session";
                    }
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

        await this.doesUserExist(platformInfo)
            .then(async (res: UserInfo) => {
                if (res.exists) {
                    await connection
                        .getRepository(Session)
                        .findOne({
                            where: {
                                platformGroupId: groupId,
                            },
                        })
                        .then(async (session: any) => {
                            if (
                                res.inSession &&
                                res?.sessionInfo?.id === session.sessionId
                            ) {
                                status.done = true;
                                status.message =
                                    "You're already a part of this session.";
                            } else if (
                                res.inSession &&
                                res?.sessionInfo?.id != session.sessionId
                            ) {
                                status.done = false;
                                status.message =
                                    "You're already in a sesssion.";
                            } else if (!res.inSession) {
                                let members = JSON.parse(session.members);
                                if (!members.includes(userId)) {
                                    members.push(userId);
                                    session.members = JSON.stringify(members);
                                    await connection.manager
                                        .save(session)
                                        .then((_session: any) => {
                                            console.log(_session);
                                            status.done = true;
                                            status.message = `Added user ${userId} session ${_session.sessionId}`;
                                        })
                                        .catch((error: object) =>
                                            console.log(
                                                `ERROR: joinSession: L263 unable to save sessions`,
                                                error
                                            )
                                        );
                                }
                            }
                            // } else {
                            //     status.done = false;
                            //     status.message =
                            //         "You are already a part of this session";
                        })
                        .catch((error) => {
                            status.done = false;
                            status.message = "Unable to find a session";
                            status.error = error;
                        });
                } else {
                    status.done = false;
                    status.message =
                        "Unable to find you in database, please register first";
                }
            })
            .catch(() => {
                status.done = false;
                status.message = "Unable to add user to session";
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
            .then((session?: Session) => {
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
                    session.playInstant === true ? false : false;
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
        let status: MethodStatus = {
            done: false,
            message: undefined,
            data: undefined,
        };
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

    static async isUserInSession(
        platformInfo: PlatformInfo
    ): Promise<MethodStatus> {
        const connection: Connection = getConnection();
        const sessionRepository: Repository<Session> = connection.getRepository(
            Session
        );

        let status: MethodStatus = {
            done: false,
            data: undefined,
        };

        let sessionInfo: SessionInfo = {
            id: undefined,
            platform: undefined,
            groupId: undefined,
        };

        await sessionRepository
            .find()
            .then(async (sessions: Session[]) => {
                let member: string = (platformInfo.type == 1
                    ? platformInfo.discordUserId
                    : platformInfo.telegramUserId) as string;
                for (const session of sessions) {
                    let members: string[] = JSON.parse(session.members);
                    if (members.includes(member)) {
                        sessionInfo.id = session.sessionId;
                        sessionInfo.platform = session.platform;
                        sessionInfo.groupId = session.platformGroupId;
                        sessionInfo.members = members;
                        status.done = true;
                        status.data = sessionInfo;
                        break;
                    }
                }
            })
            .catch(() => {
                status.done = false;
                status.message = "Unable to get User's sessions status";
                status.data = undefined;
            });
        return status;
    }

    static async getSessionInfo(
        platformInfo: PlatformInfo
    ): Promise<MethodStatus> {
        let status: MethodStatus = {
            done: false,
            message: undefined,
        };
        let sessionInfo: SessionInfo = {
            id: undefined,
            platform: platformInfo.type,
            groupId:
                platformInfo.type == 1
                    ? platformInfo.discordServerId
                    : platformInfo.telegramGroupId,
        };

        const sessionRepository: Repository<Session> = getConnection().getRepository(
            Session
        );

        await sessionRepository
            .findOne({
                where: {
                    platformGroupId:
                        platformInfo.type == 1
                            ? platformInfo.discordServerId
                            : platformInfo.telegramGroupId,
                },
            })
            .then((session?: Session) => {
                sessionInfo.id = session?.sessionId;
                sessionInfo.members = JSON.parse(session?.members as string);
                status.done = true;
                status.message = "Successfully fetched session info.";
                status.data = sessionInfo;
            })
            .catch((error) => {
                status.done = false;
                status.error = error;
            });

        return status;
    }

    static async leaveSession(platformInfo: PlatformInfo) {
        const userId: string = (platformInfo.type == 1
            ? platformInfo.discordUserId
            : platformInfo.telegramUserId) as string;
        const connection: Connection = getConnection();

        let status: MethodStatus = {
            done: false,
            message: undefined,
            data: undefined,
        };

        await this.doesUserExist(platformInfo).then(async (user: UserInfo) => {
            if (user.exists) {
                await this.doesSessionExist(platformInfo)
                    .then(async (session: MethodStatus) => {
                        if (
                            user.inSession &&
                            user.sessionInfo?.id === session.data.sessionId
                            //
                        ) {
                            if (user.id !== session.data.createdBy) {
                                let members = JSON.parse(
                                    session.data.members as string
                                );
                                if (
                                    members.length == 1 &&
                                    members.includes(userId)
                                ) {
                                    connection
                                        .createQueryBuilder()
                                        .delete()
                                        .from(Session)
                                        .where("sessionId = :sessionId", {
                                            sessionId: session.data.sessionId,
                                        })
                                        .execute();
                                    status.done = true;
                                    status.message =
                                        "The session has been deleted since you were the only member (and admin)...";
                                } else {
                                    const filtered_members: string[] = members.filter(
                                        (user: string) => {
                                            user !==
                                                (platformInfo.type == 1
                                                    ? platformInfo.discordUserId
                                                    : platformInfo.telegramUserId);
                                        }
                                    );
                                    session.data.members = JSON.stringify(
                                        filtered_members
                                    );
                                    await connection.manager
                                        .save(session)
                                        .then((_res) => {
                                            console.log(_res);
                                            status.done = true;
                                            status.message =
                                                "You have left the session";
                                            status.data = _res;
                                        })
                                        .catch((err) => {
                                            console.log("err");
                                            status.done = false;
                                            status.message =
                                                "Unable to leave session";
                                            status.error = err;
                                        });
                                }
                            } else {
                                status.done = false;
                                status.message = "An admin cannot leave the session."
                            }
                        } else {
                            status.done = false;
                            status.message =
                                "You can't leave a session you're not a part of.";
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        status.done = false;
                        status.message = "Unable to leave session";
                        status.error = err;
                    });
            } else {
                status.done = false;
                status.message = "Are you sure you're registered?";
            }
        });
        return status;
    }
}
