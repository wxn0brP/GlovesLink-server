import { WebSocketServer } from "ws";
import { Server_Opts } from "./types.js";
import { GLSocket } from "./socket.js";
import FalconFrame from "@wxn0brp/falcon-frame";
import { Room, Rooms } from "./room.js";
export declare class GlovesLinkServer {
    wss: WebSocketServer;
    private onConnectEvent;
    logs: boolean;
    opts: Server_Opts;
    initStatusTemp: {
        [key: string]: number;
    };
    rooms: Rooms;
    globalRoom: Room;
    constructor(opts: Partial<Server_Opts>);
    private saveSocketStatus;
    onConnect(handler: (ws: GLSocket) => void): void;
    broadcast(event: string, ...args: any[]): void;
    broadcastRoom(roomName: string, event: string, ...args: any[]): void;
    broadcastWithoutSelf(socket: GLSocket, event: string, ...args: any[]): void;
    room(name: string): Room;
    falconFrame(app: FalconFrame, clientDir?: string): void;
}
export { GLSocket };
