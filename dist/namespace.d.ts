import { AuthFn } from "./types.js";
import { GLSocket } from "./socket.js";
import { Room } from "./room.js";
import { GlovesLinkServer } from "./index.js";
export declare class Namespace {
    name: string;
    private server;
    private onConnectEvent;
    authFn: AuthFn;
    room: Room;
    constructor(name: string, server: GlovesLinkServer);
    onConnect(handler: (ws: GLSocket) => void): this;
    auth(authFn: AuthFn): this;
    get onConnectHandler(): (ws: GLSocket) => void;
    emit(event: string, ...args: any[]): void;
    emitWithoutSelf(socket: GLSocket, event: string, ...args: any[]): void;
}
