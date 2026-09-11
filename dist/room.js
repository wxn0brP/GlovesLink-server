import EventEmitter from "events";
/**
 * Room class represents a collection of sockets that can communicate with each other
 */
export class Room {
    _clients = new Set();
    eventEmitter = new EventEmitter();
    /**
     * Adds a socket to the room
     * @param socket - The socket to add to the room
     */
    join(socket) {
        this._clients.add(socket);
        socket.rooms.add(this);
        this.eventEmitter.emit("join", socket, this);
    }
    /**
     * Removes a socket from the room
     * @param socket - The socket to remove from the room
     */
    leave(socket) {
        this._clients.delete(socket);
        socket.rooms.delete(this);
        this.eventEmitter.emit("leave", socket, this);
        if (this._clients.size === 0)
            this.eventEmitter.emit("empty", this);
    }
    /**
     * Removes all sockets from the room
     */
    leaveAll() {
        for (const socket of this._clients)
            socket.rooms.delete(this);
        this._clients.clear();
        this.eventEmitter.emit("leaveAll", this);
        this.eventEmitter.emit("empty", this);
    }
    /**
     * Registers a handler for when a socket joins the room
     * @param handler - The function to be called when a socket joins the room
     * @returns The current Room instance for chaining
     */
    onJoin(handler) {
        this.eventEmitter.on("join", handler);
        return this;
    }
    /**
     * Registers a handler for when a socket leaves the room
     * @param handler - The function to be called when a socket leaves the room
     * @returns The current Room instance for chaining
     */
    onLeave(handler) {
        this.eventEmitter.on("leave", handler);
        return this;
    }
    /**
     * Gets the number of clients in the room
     * @returns The number of clients in the room
     */
    get size() {
        return this._clients.size;
    }
    /**
     * Gets an array of all clients in the room
     * @returns An array containing all the sockets in the room
     */
    get sockets() {
        return Array.from(this._clients);
    }
    /**
     * Emits an event to all clients in the room
     * @param evtName - The name of the event to emit
     * @param data - The data to send with the event
     */
    emit(evtName, ...data) {
        for (const socket of this._clients) {
            socket.emit(evtName, ...data);
        }
    }
    /**
     * Emits an event to all clients in the room except the specified socket
     * @param socket - The socket to exclude from the emission
     * @param evtName - The name of the event to emit
     * @param data - The data to send with the event
     */
    emitWithoutSelf(socket, evtName, ...data) {
        for (const client of this._clients) {
            if (client === socket)
                continue;
            client.emit(evtName, ...data);
        }
    }
    /**
     * Checks if a socket is in the room
     * @param socket - The socket to check
     * @returns True if the socket is in the room, false otherwise
     */
    has(socket) {
        return this._clients.has(socket);
    }
}
/**
 * Gets or creates a room by name
 * @param rooms - The map of rooms to search in
 * @param name - The name of the room to get or create
 * @returns The Room instance
 */
export function getRoom(rooms, name) {
    const existedRoom = rooms.get(name);
    if (existedRoom)
        return existedRoom;
    const createdRoom = new Room();
    rooms.set(name, createdRoom);
    createdRoom.eventEmitter.on("empty", () => rooms.delete(name));
    return createdRoom;
}
