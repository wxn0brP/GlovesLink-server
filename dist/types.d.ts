import http from "http";
export interface Server_Opts {
    server: http.Server;
    logs: boolean;
    authFn: AuthFn;
}
export interface Server_DataEvent {
    evt: string;
    data: any[];
    ackI?: number[];
}
export interface Server_AckEvent {
    ack: number;
    data: any[];
}
export interface Server_Auth_Opts {
    headers: http.IncomingHttpHeaders;
    url: URL;
    token?: string;
}
export type AuthFn = (data: Server_Auth_Opts) => boolean | Promise<boolean>;
