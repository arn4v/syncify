import axios from "axios";
import { ShuffleRepeatState, RequestStatus } from "../../interfaces/spotify";
import { SpotifyInfo } from "../../interfaces/global";
import { endpoints } from "./endpoints";
import { refreshAccessToken } from "./refresh_tokens";

export async function toggleShuffleRepeatRequest(
    requestType: number,
    toggleState: ShuffleRepeatState,
    spotifyInfo: SpotifyInfo
): Promise<RequestStatus> {
    let requestUrl: string =
        requestType == 1
            ? endpoints.shuffle_playback.url
            : endpoints.repeat_playback.url;

    // Can probably unify response and error since they serve the same
    // purpose
    let status: RequestStatus = {
        successfull: false,
        status: undefined,
        response: undefined,
        error: undefined,
        isRefreshed: false,
    };

    await axios({
        method: "put",
        url: requestUrl,
        headers: {
            Authorization: `Bearer ${spotifyInfo.spotifyAccessToken}`,
        },
        params: { state: toggleState },
    })
        .then(async (res: any) => {
            status.response = res.data;
            if (res.status == (200 || 201 || 204)) {
                status.status = res.status;
                status.successfull = true;
            } else if (res.status == (400 || 401)) {
                await refreshAccessToken(spotifyInfo.spotifyRefreshToken).then(
                    async (newAccessToken: string) => {
                        await axios({
                            method: "put",
                            url: requestUrl,
                            headers: {
                                Authorization: `Bearer ${newAccessToken}`,
                            },
                            params: { state: toggleState },
                        })
                            .then(async (_res: any) => {
                                status.status = res.status;
                                status.response = _res.data;
                                if (_res.status == (200 || 201)) {
                                    status.successfull = true;
                                }
                            })
                            .catch((error: Error) => {
                                status.error = error;
                                console.log(
                                    `ERROR: toggleShuffle: axiosFunc: Catch Block ${error}`
                                );
                            });
                    }
                );
            }
        })
        .catch((error) => {
            status.error = error;
            console.log(`ERROR: toggleShuffle: ${error}`);
        });
    return status;
}
