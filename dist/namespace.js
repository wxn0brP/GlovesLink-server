import { getRoom, Room } from "./room.js";
/**
 * Namespace class represents a logical grouping of sockets that can communicate with each other
 */
export class Namespace {
    name;
    server;
    _onConnectHandler = () => { };
    authFn = async () => ({ status: 200 });
    _room = new Room();
    rooms = new Map();
    users = new Map();
    /**
     * Creates a new Namespace instance
     * @param name - The name of the namespace
     * @param server - The GlovesLinkServer instance
     */
    constructor(name, server) {
        this.name = name;
        this.server = server;
    }
    /**
     * Sets the connection event handler for this namespace
     * @param handler - The function to be called when a socket connects to this namespace
     * @returns The current Namespace instance for chaining
     */
    onConnect(handler) {
        this._onConnectHandler = handler;
        return this;
    }
    /**
     * Sets the authentication function for this namespace
     * @param authFn - The authentication function to be used for this namespace
     * @returns The current Namespace instance for chaining
     */
    auth(authFn) {
        this.authFn = authFn;
        return this;
    }
    /**
     * Emits an event to all sockets in the namespace's room
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emit(event, ...args) {
        this._room.emit(event, ...args);
    }
    /**
     * Gets or creates a room by name
     * @param name - The name of the room to get or create
     * @returns The Room instance
     */
    room(name) {
        return getRoom(this.rooms, name);
    }
    /**
     * Emits an event to all sockets in the namespace's room except the specified socket
     * @param socket - The socket to exclude from the emission
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emitWithoutSelf(socket, event, ...args) {
        this._room.emitWithoutSelf(socket, event, ...args);
    }
    /**
     * Emits an event to the socket associated with the specified user ID
     * @param userId - The user ID to target
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emitToUserId(userId, event, ...args) {
        this.users.get(userId)?.emit(event, ...args);
    }
}
