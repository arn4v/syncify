export function trackLinkValidator(link: string) {
    let status: any = {
        statusText: undefined,
        valid: undefined,
        link: undefined,
    };

    if (link.includes("spotify")) {
        try {
            new URL(link);
            status.valid = true;
            status.statusText = "Converted link to valid spotify URI";
            status.link =
                "spotify:track:" +
                link
                    .slice(link.indexOf("track/"))
                    .split("?")[0]
                    .replace("track/", "");
        } catch {
            if (link.includes("spotify:track")) {
                status.valid = true;
                status.statusText = "Passed link is already a URI";
                status.link = link;
            } else {
                status.valid = false;
                status.statusText = "Unable to validate passed link";
                status.link = link;
            }
        }
    } else {
        status.done = false;
        status.statusText = "Link doesn' contain 'spotify'";
        status.link = link;
    }
    return status;
}
