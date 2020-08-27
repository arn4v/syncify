import axios from "axios";
import qs from "qs";
import { endpoints } from "./endpoints";

export async function refreshAccessToken(refresh_token: any) {
    let newAccessToken: string;
    await axios({
        method: "post",
        url: endpoints.refresh_token.url,
        headers: {
            Authorization:
                "Basic " +
                Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID +
                        ":" +
                        process.env.SPOTIFY_CLIENT_SECRET
                ).toString("base64"),
            "content-type": "application/x-www-form-urlencoded",
        },
        params: qs.stringify({
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        }),
        data: qs.stringify({
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        }),
    })
        .then(async (response) => {
            if (response.status == 200) {
                newAccessToken = response.data["access_token"];
            }
        })
        .catch((error) =>
            console.log(
                `LOG: ERROR: SpotifyHelper.refreshAccessToken: ${error}`
            )
        );
    // @ts-ignore
    return newAccessToken;
}
