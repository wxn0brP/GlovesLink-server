import { GlovesLinkServer } from ".";
import { getRoom, Room, Rooms } from "./room";
import { GLSocket } from "./socket";
import { AuthFn, OnConnect } from "./types";

/**
 * Namespace class represents a logical grouping of sockets that can communicate with each other
 */
export class Namespace {
    public _onConnectHandler: OnConnect = () => { };
    public _authFn: AuthFn = async () => ({ status: 200 });
    public _room = new Room();
    public rooms: Rooms = new Map();
    public users: Rooms = new Map();

    /**
     * Creates a new Namespace instance
     * @param name - The name of the namespace
     * @param server - The GlovesLinkServer instance
     */
    constructor(public name: string, private server: GlovesLinkServer) { }

    /**
     * Sets the connection event handler for this namespace
     * @param handler - The function to be called when a socket connects to this namespace
     * @returns The current Namespace instance for chaining
     */
    onConnect(handler: OnConnect): this {
        this._onConnectHandler = handler;
        return this;
    }

    /**
     * Sets the authentication function for this namespace
     * @param authFn - The authentication function to be used for this namespace
     * @returns The current Namespace instance for chaining
     */
    auth(authFn: AuthFn): this {
        this._authFn = authFn;
        return this;
    }

    /**
     * Emits an event to all sockets in the namespace's room
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emit(event: string, ...args: any[]) {
        this._room.emit(event, ...args);
    }

    /**
     * Gets or creates a room by name
     * @param name - The name of the room to get or create
     * @returns The Room instance
     */
    room(name: string) {
        return getRoom(this.rooms, name);
    }

    /**
     * Gets or creates a room by user ID
     * @param id - The user ID to get or create the room for
     * @returns The Room instance
     */
    userRoom(id: string) {
        return getRoom(this.users, id);
    }

    /**
     * Emits an event to all sockets in the namespace's room except the specified socket
     * @param socket - The socket to exclude from the emission
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emitWithoutSelf(socket: GLSocket, event: string, ...args: any[]) {
        this._room.emitWithoutSelf(socket, event, ...args);
    }

    /**
     * Emits an event to the socket associated with the specified user ID
     * @param userId - The user ID to target
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emitToUserId(userId: string, event: string, ...args: any[]) {
        this.users.get(userId)?.emit(event, ...args);
    }
}
