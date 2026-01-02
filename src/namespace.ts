import { AuthFn, OnConnect } from "./types";
import { GLSocket } from "./socket";
import { Room } from "./room";
import { GlovesLinkServer } from ".";

/**
 * Namespace class represents a logical grouping of sockets that can communicate with each other
 */
export class Namespace {
    private onConnectEvent: OnConnect = () => { };
    public authFn: AuthFn = async () => ({ status: 200 });
    public room: Room;

    /**
     * Creates a new Namespace instance
     * @param name - The name of the namespace
     * @param server - The GlovesLinkServer instance
     */
    constructor(public name: string, private server: GlovesLinkServer) {
        const roomName = `gls-namespace-${name}`;
        this.room = this.server.room(roomName);
    }

    /**
     * Sets the connection event handler for this namespace
     * @param handler - The function to be called when a socket connects to this namespace
     * @returns The current Namespace instance for chaining
     */
    onConnect(handler: OnConnect): this {
        this.onConnectEvent = handler;
        return this;
    }

    /**
     * Sets the authentication function for this namespace
     * @param authFn - The authentication function to be used for this namespace
     * @returns The current Namespace instance for chaining
     */
    auth(authFn: AuthFn): this {
        this.authFn = authFn;
        return this;
    }

    /**
     * Gets the connection event handler for this namespace
     * @returns The connection event handler function
     */
    public get onConnectHandler() {
        return this.onConnectEvent;
    }

    /**
     * Emits an event to all sockets in the namespace's room
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emit(event: string, ...args: any[]) {
        this.room.emit(event, ...args);
    }

    /**
     * Emits an event to all sockets in the namespace's room except the specified socket
     * @param socket - The socket to exclude from the emission
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emitWithoutSelf(socket: GLSocket, event: string, ...args: any[]) {
        this.room.emitWithoutSelf(socket, event, ...args);
    }
}
