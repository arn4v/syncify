import axios from "axios";
import qs from "qs";
import { DataHelper } from "../data/data_helper";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_access_token";

export async function toggleShuffle(
    platformInfo: object,
    toggleState: boolean
) {
    let request_url = endpoints.shuffle_playback.url;
    let status: boolean = false;
    let requestFunc = async (access_token: string) => {
        let result = undefined;
        await axios({
            method: "put",
            url: request_url,
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            params: qs.stringify({ state: toggleState }),
        })
            .then((res) => {
                result = res;
            })
            .catch((error) => {
                result = error;
                console.log(`ERROR: toggleShuffle: ${error}`);
            });
        return result;
    };

    await DataHelper.fetchSpotifyTokens(platformInfo).then(
        async (spotifyInfo) => {
            // @ts-ignore
            await requestFunc(spotifyInfo.spotifyAccessToken).then(
                async (res: any) => {
                    if (res?.status == (200 || 201)) {
                        status = true;
                    } else if (res?.status == (400 || 401)) {
                        await refreshAccessToken(
                            spotifyInfo.spotifyRefreshToken
                        ).then(async (new_access_token) => {
                            await requestFunc(new_access_token)
                                .then(async (res: any) => {
                                    if (res.status == (200 || 201)) {
                                        status = true;
                                    } else {
                                        status = false;
                                    }
                                })
                                .catch((error) => {
                                    status = false;
                                    console.log(
                                        `ERROR: toggleShuffle: requestFunc: Catch Block ${error}`
                                    );
                                });
                        });
                    } else {
                        status = true;
                    }
                }
            );
        }
    );
    return status;
}
