import Axios, { AxiosRequestConfig } from "axios";
import { SpotifyInfo } from "../../interfaces/global";
import { refreshAccessToken } from "./refresh_tokens";
import { endpoints } from "./endpoints";
import { RequestStatus, Track } from "../../interfaces/spotify";
import { defaultStatusTemplate } from "../../helpers/status_template";

export async function trackInfoRequest(
    spotifyInfo: SpotifyInfo
): Promise<RequestStatus> {
    const request_url: string = endpoints.current_track.url;

    let status: RequestStatus = defaultStatusTemplate;

    let trackInfo: Track = {
        name: undefined,
        id: undefined,
        link: undefined,
        uri: undefined,
        artists: [],
    };

    let requestConfig: (accessToken: string) => AxiosRequestConfig = (
        accessToken: string
    ): AxiosRequestConfig => {
        return {
            method: "get",
            url: request_url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };
    };

    await Axios()
        .then(async (response: any) => {
            if (response.status == (200 || 201)) {
                trackInfo.id = response.data.item.uri;
                trackInfo.link = response.data.item.external_urls.spotify;
                trackInfo.name = response.data.item.name;
                trackInfo.position = response.data.progress_ms;
                trackInfo.uri = response.data.item.uri;
                response.data.item.artists.forEach((data: any) => {
                    trackInfo.artists?.push({
                        name: data.name,
                        link: data.external_urls.spotify,
                        uri: data.uri,
                    });
                });
                status.successfull = true;
                status.trackInfo = trackInfo;
                // Make this a helper instead
                // response.data.item.artists
                //     // @ts-ignore
                //     .map((e) => e.name)
                //     .join(", ");
                // TODO: Handle other status codes
            }
        })
        .catch(async (error) => {
            console.log(`ERROR: Got a 401, attempting to refresh access token`);
            status.error = error;
            await refreshAccessToken(spotifyInfo.spotifyRefreshToken)
                .then(async (newAccessToken: string) => {
                    status.isRefreshed = true;
                    status.newAccessToken = newAccessToken;
                    await Axios({
                        url: request_url,
                        method: "get",
                        headers: newAccessToken,
                    })
                        .then((response) => {
                            trackInfo.id = response.data.item.uri;
                            trackInfo.link = response.data.item.link;
                            trackInfo.name = response.data.item.name;
                            trackInfo.position = response.data.item.progress_ms;
                            trackInfo.uri = response.data.item.uri;
                            response.data.item.artists.forEach((data: any) => {
                                trackInfo.artists?.push({
                                    name: data.name,
                                    link: data.external_urls.spotify,
                                    uri: data.uri,
                                });
                            });
                            status.successfull = true;
                            status.status = response.status;
                            status.trackInfo = trackInfo;
                        })
                        .catch((error) =>
                            console.log(
                                `ERROR: getTrackInfo catch block ${error}`
                            )
                        );
                })
                .catch((error) =>
                    console.log(`ERROR: SpotifyHelper.getTrackInfo: ${error}`)
                );
        });
    return status;
}
