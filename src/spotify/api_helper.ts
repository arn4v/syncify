import request from "request";

export class SpotifyHelper {
    public static getTrackInfo(
        spotifyAccessToken: string,
        spotifyRefreshToken: string
    ): any {
        let returnString: string = "";
        let options = {
            url: "https://api.spotify.com/v1/me/player/currently-playing",
            headers: {
                Authorization: "Bearer " + spotifyAccessToken,
            },
            json: true,
        };

        request.get(options, function (error, response, body) {
            if (body.error) {
                switch (body.error.status) {
                    case 401: {
                        var authOptions = {
                            url: "https://accounts.spotify.com/api/token",
                            headers: {
                                Authorization:
                                    "Basic " +
                                    Buffer.from(
                                        process.env.SPOTIFY_CLIENT_ID +
                                            ":" +
                                            process.env.SPOTIFY_CLIENT_SECRET
                                    ).toString("base64"),
                            },
                            form: {
                                grant_type: "refresh_token",
                                refresh_token: spotifyRefreshToken,
                            },
                            json: true,
                        };

                        request.post(
                            authOptions,
                            (_error, _response, _body) => {
                                if (!_error && _response.statusCode === 200) {
                                    // firebase
                                    //     .database()
                                    //     .ref(loc)
                                    //     .update({
                                    //         spotifyAccessToken:
                                    //             _body.access_token,
                                    //     });

                                    options.headers = {
                                        Authorization:
                                            "Bearer " + _body.access_token,
                                    };

                                    request.get(options, function (
                                        __error,
                                        __response,
                                        __body
                                    ) {
                                        var song = __body.item.name;
                                        var artists = __body.item.artists
                                            // @ts-expect-error
                                            .map((e) => e.name)
                                            .join(", ");
                                        returnString += `> ${song} - ${artists}`;
                                    });
                                }
                            }
                        );
                        break;
                    }
                    default:
                        console.log(body.error);
                        break;
                }
                return;
            }
            var song = body.item.name;
            var artists = body.item.artists
                // @ts-expect-error
                .map((e) => e.name)
                .join(", ");
            returnString += `> ${song} - ${artists}`;
        });

        return returnString;
    }
}
