import http from "http";
import Stream from "stream";
import { GLSocket } from "./socket";

export interface Server_Opts {
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

export type OnConnect = (socket: GLSocket, auth: Server_Auth_Opts, result: AuthFnResult) => void;