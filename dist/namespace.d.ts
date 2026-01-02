import { AuthFn, OnConnect } from "./types.js";
import { GLSocket } from "./socket.js";
import { Room } from "./room.js";
import { GlovesLinkServer } from "./index.js";
/**
 * Namespace class represents a logical grouping of sockets that can communicate with each other
 */
export declare class Namespace {
    name: string;
    private server;
    private onConnectEvent;
    authFn: AuthFn;
    room: Room;
    /**
     * Creates a new Namespace instance
     * @param name - The name of the namespace
     * @param server - The GlovesLinkServer instance
     */
    constructor(name: string, server: GlovesLinkServer);
    /**
     * Sets the connection event handler for this namespace
     * @param handler - The function to be called when a socket connects to this namespace
     * @returns The current Namespace instance for chaining
     */
    onConnect(handler: OnConnect): this;
    /**
     * Sets the authentication function for this namespace
     * @param authFn - The authentication function to be used for this namespace
     * @returns The current Namespace instance for chaining
     */
    auth(authFn: AuthFn): this;
    /**
     * Gets the connection event handler for this namespace
     * @returns The connection event handler function
     */
    get onConnectHandler(): OnConnect;
    /**
     * Emits an event to all sockets in the namespace's room
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emit(event: string, ...args: any[]): void;
    /**
     * Emits an event to all sockets in the namespace's room except the specified socket
     * @param socket - The socket to exclude from the emission
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emitWithoutSelf(socket: GLSocket, event: string, ...args: any[]): void;
}
