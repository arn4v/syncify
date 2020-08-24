export function trackLinkValidator(link: string) {
    let status: any = {
        statusText: undefined,
        valid: undefined,
        link: undefined,
    };

    if (link.includes("spotify")) {
        if (link.includes("open.spotify.com")) {
            status.valid = true;
            status.statusText = "Converted link to valid spotify URI";
            status.link =
                "spotify:track:" +
                link
                    .slice(link.indexOf("track/"))
                    .split("?")[0]
                    .replace("track/", "");
        } else if (link.includes("spotify:track")) {
            status.valid = true;
            status.statusText = "Passed link is already a URI";
            status.link = link;
        }
    } else {
        status.done = false;
        status.statusText = "Link doesn' contain 'spotify'";
        status.link = link;
    }

    console.log(status.link);
    return status;
}
