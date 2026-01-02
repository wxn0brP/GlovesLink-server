import FalconFrame, { Router } from "@wxn0brp/falcon-frame";
import http from "http";
import { WebSocketServer } from "ws";
import { Namespace } from "./namespace.js";
import { Room, Rooms } from "./room.js";
import { GLSocket } from "./socket.js";
import { Server_Opts } from "./types.js";
/**
 * GlovesLinkServer class provides a WebSocket server with namespace and room functionality
 */
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
    /**
     * Creates a new GlovesLinkServer instance
     * @param opts - Server options including the HTTP server instance
     */
    constructor(opts: Partial<Server_Opts>);
    createServer(server: http.Server): void;
    /**
     * Saves the status of a socket connection for temporary tracking
     * @param socketSelfId - The ID of the socket
     * @param namespace - The namespace of the socket
     * @param status - The status code to save
     * @param msg - Optional message to save with the status
     * @private
     */
    private saveSocketStatus;
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
     * Gets or creates a room by name
     * @param name - The name of the room
     * @returns The room instance
     */
    room(name: string): Room;
    /**
     * Creates a router for handling status requests
     * @returns A router instance for status endpoints
     */
    statusRouter(): Router;
    /**
     * Creates a router for serving client files
     * @param clientDir - Optional directory path for client files, defaults to node_modules/@wxn0brp/gloves-link-client/dist/
     * @returns A router instance for client file serving
     */
    clientRouter(clientDir?: string): Router;
    /**
     * Integrates the GlovesLink server with a FalconFrame application
     * @param app - The FalconFrame application instance
     * @param clientDir - Optional directory path for client files, or false to disable client serving
     */
    falconFrame(app: FalconFrame, clientDir?: string | false): void;
}
export { GLSocket, Namespace, Server_Opts };
