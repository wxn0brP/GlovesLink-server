import { WebSocket } from "ws";
import { GlovesLinkServer } from "./index.js";
import { Room, Rooms } from "./room.js";
import { AuthFnResult, Server_Auth_Opts } from "./types.js";
/**
 * GLSocket class represents a WebSocket connection with additional functionality
 * @template T - The type of user data associated with the socket
 */
export declare class GLSocket<T = {
    _id?: string;
}> {
    ws: WebSocket;
    server: GlovesLinkServer;
    id: string;
    user: T;
    namespace: string;
    ackIdCounter: number;
    ackCallbacks: Map<number, Function>;
    logs: boolean;
    handlers: {
        [key: string]: Function;
    };
    rooms: Set<string>;
    authData: Server_Auth_Opts;
    authResult: AuthFnResult;
    /**
     * Creates a new GLSocket instance
     * @param ws - The underlying WebSocket connection
     * @param server - The GlovesLinkServer instance
     * @param id - Optional ID for the socket, will be generated if not provided
     */
    constructor(ws: WebSocket, server: GlovesLinkServer, id?: string);
    /**
     * Internal method to handle incoming messages from the WebSocket
     * @param raw - The raw message string received from the WebSocket
     */
    _handle(raw: string): void;
    /**
     * Registers an event handler for the specified event
     * @param evt - The event name to listen for
     * @param handler - The function to be called when the event is received
     */
    on(evt: string, handler: (...args: any[]) => void | any): void;
    /**
     * Sends an event to the connected WebSocket client
     * @param evt - The event name to send
     * @param args - The arguments to pass with the event
     */
    emit(evt: string, ...args: any[]): void;
    /**
     * Sends an event to the connected WebSocket client (alias for emit)
     * @param evt - The event name to send
     * @param args - The arguments to pass with the event
     * @returns The result of the emit method
     */
    send(evt: string, ...args: any[]): void;
    /**
     * Closes the WebSocket connection
     */
    close(): void;
    /**
     * Joins the socket to a room
     * @param roomName - The name of the room to join
     */
    joinRoom(roomName: string): void;
    /**
     * Removes the socket from a room
     * @param roomName - The name of the room to leave
     */
    leaveRoom(roomName: string): void;
    /**
     * Removes the socket from all rooms it has joined
     */
    leaveAllRooms(): void;
    /**
     * Gets the namespace associated with this socket
     * @returns The namespace object or undefined if not found
     */
    getNamespace(): import("./namespace.js").Namespace;
    /**
     * Gets the room associated with this socket's namespace
     * @returns The room object or undefined if namespace is not found
     */
    namespaceRoom(): Room;
    /**
     * Gets a room from the server by name
     * @param roomName - The name of the room to retrieve
     * @returns The room object
     */
    serverRoom(roomName: string): Room;
    /**
     * Gets all rooms from the server
     * @returns A map of all rooms on the server
     */
    serverRooms(): Rooms;
    disconnect(): void;
}
