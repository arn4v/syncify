import axios from "axios";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";
import { trackLinkValidator } from "../helpers/spotify_link_validator";

export async function playTrack(platformInfo: any, songLink: string) {
    const request_url: string = endpoints.play_track.url;
    let status: any = {
        done: undefined,
        message: undefined,
    };
    let new_access_token: string;

    let requestFunc = async (platInfo: any) => {
        let _done: boolean;
        const isValid: any = trackLinkValidator(songLink);
        if (isValid.valid == true) {
            await DataHelper.fetchSpotifyTokens(platInfo)
                .then(async (spotifyInfo: any) => {
                    let access_token: string = spotifyInfo.spotifyAccessToken;
                    await axios({
                        url: request_url,
                        method: "put",
                        headers: {
                            Authorization: "Bearer " + access_token,
                        },
                        data: {
                            uris: [isValid.link],
                        },
                    })
                        .then((res) => {
                            res.status == 204
                                ? (_done = true)
                                : (_done = false);
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
                    console.log(
                        "ERROR: DataHelper.fetchSpotifyTokens: " + __error
                    )
                );
        } else {
            _done = false;
        }
        // @ts-ignore
        return _done;
    };

    await DataHelper.doesSessionExist(platformInfo)
        .then(async (res: any) => {
            console.log(res);
            if (res.status == 200) {
                console.log(res);
                let members: string[] = JSON.parse(res.data.members);
                try {
                    for (const member of members) {
                        console.log("idhar aaya?");
                        let platInfo = platformInfo;
                        platInfo.type == 1
                            ? (platInfo.discordUserId = member)
                            : (platInfo.telegramUserId = member);
                        await requestFunc(platInfo).catch((error) =>
                            console.log(error)
                        );
                    }
                    status.done = true;
                    status.message = "Playing requested track";
                } catch (err) {
                    if (err) status.done = false;
                    status.message = "Unable to play requested track";
                }
            } else {
                await requestFunc(platformInfo)
                    .then((_res: any) => {
                        if (_res == true) {
                            status.done = true;
                            status.message = "Playing requested track";
                        } else {
                            status.done = false;
                            status.message = "Unable to play requested track";
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        status.done = false;
                        status.message = "Unable to play requested track";
                    });
            }
        })
        .catch((error) => {
            console.log(error);
            status.done = false;
            status.message = "Unable to play requested track";
        });

    // @ts-ignore
    return status;
}
