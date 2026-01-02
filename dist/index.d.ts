import { WebSocketServer } from "ws";
import { Server_Opts } from "./types.js";
import { GLSocket } from "./socket.js";
import FalconFrame from "@wxn0brp/falcon-frame";
import { Room, Rooms } from "./room.js";
import { Namespace } from "./namespace.js";
export declare class GlovesLinkServer {
    wss: WebSocketServer;
    logs: boolean;
    opts: Server_Opts;
    initStatusTemp: {
        [key: string]: number;
    };
    rooms: Rooms;
    private namespaces;
    constructor(opts: Partial<Server_Opts>);
    private saveSocketStatus;
    of(path: string): Namespace;
    broadcastRoom(roomName: string, event: string, ...args: any[]): void;
    room(name: string): Room;
    falconFrame(app: FalconFrame, clientDir?: string | false): void;
}
export { GLSocket, Namespace, Server_Opts };
