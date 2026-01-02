import { WebSocketServer } from "ws";
import { Server_Opts } from "./types.js";
import { GLSocket } from "./socket.js";
import FalconFrame, { Router } from "@wxn0brp/falcon-frame";
import { Room, Rooms } from "./room.js";
import { Namespace } from "./namespace.js";
export declare class GlovesLinkServer {
    wss: WebSocketServer;
    logs: boolean;
    opts: Server_Opts;
    initStatusTemp: Record<string, {
        status: number;
        msg?: string;
    }>;
    rooms: Rooms;
    namespaces: Map<string, Namespace>;
    constructor(opts: Partial<Server_Opts>);
    private saveSocketStatus;
    of(path: string): Namespace;
    broadcastRoom(roomName: string, event: string, ...args: any[]): void;
    room(name: string): Room;
    statusRouter(): Router;
    clientRouter(clientDir?: string): Router;
    falconFrame(app: FalconFrame, clientDir?: string | false): void;
}
export { GLSocket, Namespace, Server_Opts };
