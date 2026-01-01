import { AuthFn } from "./types";
import { GLSocket } from "./socket";
import { Room } from "./room";
import { GlovesLinkServer } from ".";

export class Namespace {
    private onConnectEvent: (ws: GLSocket) => void = () => { };
    public authFn: AuthFn = () => false;
    public room: Room;

    constructor(public name: string, private server: GlovesLinkServer) {
        const roomName = `gls-namespace-${name}`;
        this.room = this.server.room(roomName);
    }

    onConnect(handler: (ws: GLSocket) => void): this {
        this.onConnectEvent = handler;
        return this;
    }

    auth(authFn: AuthFn): this {
        this.authFn = authFn;
        return this;
    }

    public get onConnectHandler() {
        return this.onConnectEvent;
    }

    emit(event: string, ...args: any[]) {
        this.room.emit(event, ...args);
    }

    emitWithoutSelf(socket: GLSocket, event: string, ...args: any[]) {
        this.room.emitWithoutSelf(socket, event, ...args);
    }
}
