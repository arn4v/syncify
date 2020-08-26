import axios from "axios";
import qs from "qs";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { MethodStatus } from "../types/status";

export async function toggleShuffleRepeat(
    platformInfo: object,
    toggleState: boolean | string,
    request_type: number
) {
    let request_url: string =
        request_type == 1
            ? endpoints.shuffle_playback.url
            : endpoints.repeat_playback.url;
    let status: any = {
        done: undefined,
        message: undefined,
    };
    let axiosFunc = async (access_token: string) => {
        let result = undefined;
        await axios({
            method: "put",
            url: request_url,
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            params: { state: toggleState },
        })
            .then((res) => {
                result = { type: 0, returned: res };
            })
            .catch((error) => {
                result = { type: 1, returned: error };
                console.log(`ERROR: toggleShuffle: ${error}`);
            });
        return result;
    };

    let requestFunc = async (platInfo: any) => {
        await DataHelper.fetchSpotifyTokens(platformInfo).then(
            async (spotifyInfo) => {
                // @ts-ignore
                await axiosFunc(spotifyInfo.spotifyAccessToken)
                    .then(async (res: any) => {
                        let response =
                            res.type == 0
                                ? res.returned
                                : res.returned.response;
                        if (response.status == (200 || 201 || 204)) {
                            status = true;
                        } else if (response.status == (400 || 401)) {
                            await refreshAccessToken(
                                spotifyInfo.spotifyRefreshToken
                            ).then(async (new_access_token) => {
                                await axiosFunc(new_access_token)
                                    .then(async (_res: any) => {
                                        let _response =
                                            _res.type == 0
                                                ? _res.returned
                                                : _res.returned.response;
                                        if (_response.status == (200 || 201)) {
                                            status = true;
                                        } else {
                                            status = false;
                                        }
                                    })
                                    .catch((error) => {
                                        status = false;
                                        console.log(
                                            `ERROR: toggleShuffle: axiosFunc: Catch Block ${error}`
                                        );
                                    });
                            });
                        } else {
                            status = true;
                        }
                    })
                    .catch((error) =>
                        console.log(
                            `ERROR: toggleShuffle: Last catch block: ${error}`
                        )
                    );
            }
        );
    };

    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: MethodStatus) => {
            console.log(res);
            if (res.done) {
                console.log(res);
                let members: string[] = JSON.parse(res.data.members);
                try {
                    for (const member of members) {
                        let platInfo: any = platformInfo;
                        platInfo.type == 1
                            ? (platInfo.discordUserId = member)
                            : (platInfo.telegramUserId = member);
                        await requestFunc(platInfo).catch((error) =>
                            console.log(error)
                        );
                    }
                    status.done = true;
                    status.message =
                        request_type == 1
                            ? "Shuffled playback for this session"
                            : "Put playback on repeat for the session.";
                } catch (err) {
                    if (err) status.done = false;
                    status.message =
                        request_type == 1
                            ? `Unable to shuffle playback for session`
                            : "Unable to put playback on repeat for session";
                }
            } else {
                await requestFunc(platformInfo)
                    .then((_res: any) => {
                        if (_res == true) {
                            status.done = true;
                            status.message =
                                request_type == 1
                                    ? `Shuffled playback`
                                    : `Put playback on repeat`;
                        } else {
                            status.done = false;
                            status.message =
                                request_type == 1
                                    ? "Unable to shuffle playback"
                                    : "Unable to put playback on repeat.";
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message =
                            request_type == 1
                                ? "Unable to shuffle playback."
                                : "Unable to put playback on repeat.";
                    });
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = `Unable to pause`;
        });

    return status;
}
