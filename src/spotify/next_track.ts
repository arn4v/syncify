import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";

export async function resumePausePlayback(
    request_type: number,
    platformInfo: any
) {
    const request_url: string =
        request_type == 1
            ? endpoints.resume_playback.url
            : endpoints.pause_playback.url;
    let new_access_token: string;
    let done: boolean;
    let requestFunc = async (platInfo: any) => {
        let _done: boolean;
        await DataHelper.fetchSpotifyTokens(platInfo)
            .then(async (spotifyInfo: any) => {
                let access_token: string = spotifyInfo.spotifyAccessToken;
                await axios({
                    url: request_url,
                    method: "put",
                    headers: {
                        Authorization: "Bearer " + access_token,
                    },
                })
                    .then((res) => {
                        res.status == 204 ? (_done = true) : (done = false);
                    })
                    .catch(async (error) => {
                        if (error.response.status == 401) {
                            await refreshAccessToken(
                                spotifyInfo.spotifyRefreshToken
                            ).then(async (data: any) => {
                                new_access_token = data;
                                DataHelper.updateSpotifyAccessToken(
                                    data,
                                    platformInfo
                                );
                                await axios({
                                    url: request_url,
                                    method: "put",
                                    headers: {
                                        Authorization:
                                            "Bearer " + new_access_token,
                                    },
                                })
                                    .then((_res) => {
                                        if (_res.status == 204) {
                                            _done = true;
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
                            _done = false;
                        }
                    });
            })
            .catch((__error) =>
                console.log("ERROR: DataHelper.fetchSpotifyTokens: " + __error)
            );
        // @ts-ignore
        return done;
    };

    await DataHelper.doesSessionExist(platformInfo).then(async (res: any) => {
        if (res.status == 200) {
            let members: string[] = JSON.parse(res.data.members);
            try {
                for (const member of members) {
                    let platInfo = platformInfo;
                    platInfo.type == 1
                        ? (platInfo.discordUserId = member)
                        : (platInfo.telegramUserId = member);
                    await requestFunc(platInfo).catch((error) =>
                        console.log(error)
                    );
                }
                done = true;
            } catch (err) {
                if (err) done = false;
            }
        } else {
            await requestFunc(platformInfo)
                .then((status: any) => {
                    if (status == true) done = true;
                    else done = false;
                })
                .catch((error) => {
                    console.log(error);
                    done = false;
                });
        }
    });

    // @ts-ignore
    return done;
}
