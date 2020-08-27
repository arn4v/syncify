import axios from "axios";
import { DataHelper } from "../../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";
import { MethodStatus, PlatformInfo, SpotifyInfo } from "../../interfaces/global";

export async function seekRequest(
    platformInfo: PlatformInfo,
    spotifyInfo: SpotifyInfo,
    position_ms: number | undefined
): Promise<MethodStatus> {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };

    const request_url: string = endpoints.seek.url;
    let access_token: string | undefined = spotifyInfo.spotifyAccessToken;
    let new_access_token: string;

    if (position_ms != undefined) {
        await axios({
            url: request_url,
            method: "put",
            headers: {
                Authorization: "Bearer " + access_token,
            },
            params: {
                position_ms: position_ms,
            },
        })
            .then((res) => {
                res.status == 204
                    ? (status.done = true)
                    : (status.done = false);
            })
            .catch(async (error) => {
                if (error.response.status == 401) {
                    await refreshAccessToken(
                        spotifyInfo.spotifyRefreshToken
                    ).then(async (data: any) => {
                        new_access_token = data;
                        DataHelper.updateSpotifyAccessToken(data, platformInfo);
                        await axios({
                            url: request_url,
                            method: "put",
                            headers: {
                                Authorization: "Bearer " + new_access_token,
                            },
                            params: {
                                position_ms: position_ms,
                            },
                        })
                            .then((_res) => {
                                if (_res.status == 204) {
                                    status.done = true;
                                }
                            })
                            .catch((_error) =>
                                console.log(
                                    "Error: resumePausePlayback: Second axios call: ",
                                    _error
                                )
                            );
                    });
                } else {
                    console.log(
                        `ERROR: SpotifyHelper.resumePlayback: ${error.response.status}`
                    );
                    status.done = false;
                }
            });
    } else {
        status.done = false;
        status.message = "Position cannot be undefined";
    }
    return status;
}

// This function serves to fetch spotify access/refresh token for
// seekRequestFunc to use to carry out the call to the Spotify
// Web API
async function fetchAndRequest(
    platformInfo: PlatformInfo,
    rt: number
): Promise<boolean> {
    let done: boolean = false;
    await DataHelper.fetchSpotifyTokens(platformInfo)
        .then(async (spotifyInfo: SpotifyInfo) => {
            await seekRequest(platformInfo, spotifyInfo, rt)
                .then((res) => {
                    if (res.done) {
                        done = true;
                    } else {
                        done = false;
                    }
                })
                .catch(() => (done = false));
        })
        .catch(() => {
            done = false;
        });
    return done;
}

export async function seek(request_type: number, platformInfo: any) {
    let status: MethodStatus = {
        done: undefined,
        message: undefined,
    };
    let unsuccessful = "Unable to seek to position";
    let successfull = "Succesfully seeked to position";

    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: MethodStatus) => {
            if (res.done) {
                let members: string[] = JSON.parse(res.data.members);
                try {
                    for (const member of members) {
                        let platInfo = platformInfo;
                        platInfo.type == 1
                            ? (platInfo.discordUserId = member)
                            : (platInfo.telegramUserId = member);
                        await fetchAndRequest(
                            platInfo,
                            request_type
                        ).catch((error) => console.log(error));
                    }
                    status.done = true;
                    status.message = successfull;
                } catch {
                    status.done = false;
                    status.message = unsuccessful;
                }
            } else {
                await fetchAndRequest(platformInfo, request_type)
                    .then((_res: any) => {
                        if (_res == true) {
                            status.done = true;
                            status.message = successfull;
                        } else {
                            status.done = false;
                            status.message = unsuccessful;
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message = unsuccessful;
                    });
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = unsuccessful;
        });

    return status;
}
