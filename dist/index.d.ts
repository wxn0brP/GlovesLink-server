import FalconFrame from "@wxn0brp/falcon-frame";
import http from "http";
import { WebSocketServer } from "ws";
import { Namespace } from "./namespace.js";
import { Room } from "./room.js";
import { GLSocket } from "./socket.js";
import { Server_Opts } from "./types.js";
/**
 * GlovesLinkServer class provides a WebSocket server with namespace and room functionality
 */
export declare class GlovesLinkServer {
    wss: WebSocketServer;
    opts: Server_Opts;
    initStatusTemp: Record<string, {
        status: number;
        msg?: string;
    }>;
    namespaces: Map<string, Namespace>;
    /**
     * Creates a new GlovesLinkServer instance
     * @param opts - Server options including the HTTP server instance
     */
    constructor(opts: Partial<Server_Opts>);
    attachToHttpServer(server: http.Server): void;
    /**
     * Gets or creates a namespace by path
     * @param path - The path for the namespace
     * @returns The namespace instance
     */
    of(path: string): Namespace;
    /**
     * Broadcasts an event to all sockets in a room
     * @param roomName - The name of the room to broadcast to
     * @param event - The event name to broadcast
     * @param args - Arguments to send with the event
     */
    broadcastRoom(roomName: string, event: string, ...args: any[]): void;
    /**
     * Gets or creates a room by name (from the root namespace)
     * @param name - The name of the room
     * @returns The room instance
     */
    room(name: string): Room;
    /**
     * Gets or creates a room by user ID (from the root namespace)
     * @param userId - The user ID
     * @returns The room instance
     */
    userRoom(userId: string): Room;
    /**
     * Emits an event to the socket associated with the specified user ID
     * @param userId - The user ID to target
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emitToUserId(userId: string, event: string, ...args: any[]): void;
    /**
     * Integrates the GlovesLink server with a FalconFrame application
     * @param app - The FalconFrame application instance
     * @param clientDir - Optional directory path for client files, or false to disable client serving
     */
    falconFrame(app: FalconFrame, clientDir?: string | false): void;
}
export { GLSocket, Namespace, Server_Opts };
