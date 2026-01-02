import http from "http";
import Stream from "stream";

export interface Server_Opts {
    server: http.Server;
    logs: boolean;
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
    request: http.IncomingMessage;
    socket: Stream.Duplex;
    head: Buffer<ArrayBufferLike>;
    data?: Record<string, any>;
}

export interface AuthFnResult {
    status: number;
    user?: Record<string, any>;
    msg?: string;
    toSet?: Record<string, any>;
}

export type AuthFn = (data: Server_Auth_Opts) => Promise<AuthFnResult>;