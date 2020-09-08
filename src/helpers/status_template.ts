import { MethodStatus, RequestStatus } from "../interfaces/interfaces";

export let defaultStatusTemplate: RequestStatus = {
    successfull: false,
    status: undefined,
    error: undefined,
    response: undefined,
    isRefreshed: false,
};
