import { Track } from "./track";

export interface MethodStatus {
    done: boolean | undefined;
    message: string | undefined;
    data?: any | Track;
    rawData?: any;
}
