import { MethodStatus } from "../interfaces/global";
import { RequestStatus } from "../interfaces/spotify";

export let defaultStatusTemplate: RequestStatus = {
    successfull: false,
    status: undefined,
    error: undefined,
    response: undefined,
    isRefreshed: false,
};
