import EventEmitter from "events";
import { GLSocket } from "./socket";

export type Rooms = Map<string, Room>;

/**
 * Room class represents a collection of sockets that can communicate with each other
 */
export class Room {
    clients: Set<GLSocket> = new Set();
    eventEmitter = new EventEmitter();

    /**
     * Adds a socket to the room
     * @param socket - The socket to add to the room
     */
    join(socket: GLSocket) {
        this.clients.add(socket);
        this.eventEmitter.emit("join", socket, this);
    }

    /**
     * Removes a socket from the room
     * @param socket - The socket to remove from the room
     */
    leave(socket: GLSocket) {
        this.clients.delete(socket);
        this.eventEmitter.emit("leave", socket, this);
    }

    /**
     * Removes all sockets from the room
     */
    leaveAll() {
        this.clients.clear();
        this.eventEmitter.emit("leaveAll", this);
    }

    /**
     * Registers a handler for when a socket joins the room
     * @param handler - The function to be called when a socket joins the room
     * @returns The current Room instance for chaining
     */
    onJoin(handler: (socket: GLSocket, room: Room) => void) {
        this.eventEmitter.on("join", handler);
        return this;
    }

    /**
     * Registers a handler for when a socket leaves the room
     * @param handler - The function to be called when a socket leaves the room
     * @returns The current Room instance for chaining
     */
    onLeave(handler: (socket: GLSocket, room: Room) => void) {
        this.eventEmitter.on("leave", handler);
        return this;
    }

    /**
     * Gets the number of clients in the room
     * @returns The number of clients in the room
     */
    get size() {
        return this.clients.size;
    }

    /**
     * Gets an array of all clients in the room
     * @returns An array containing all the sockets in the room
     */
    get sockets() {
        return Array.from(this.clients);
    }

    /**
     * Emits an event to all clients in the room
     * @param evtName - The name of the event to emit
     * @param data - The data to send with the event
     */
    emit(evtName: string, ...data: any) {
        for (const socket of this.clients) {
            socket.emit(evtName, ...data);
        }
    }

    /**
     * Emits an event to all clients in the room except the specified socket
     * @param socket - The socket to exclude from the emission
     * @param evtName - The name of the event to emit
     * @param data - The data to send with the event
     */
    emitWithoutSelf(socket: GLSocket, evtName: string, ...data: any) {
        for (const client of this.clients) {
            if (client === socket) continue;
            client.emit(evtName, ...data);
        }
    }

    /**
     * Checks if a socket is in the room
     * @param socket - The socket to check
     * @returns True if the socket is in the room, false otherwise
     */
    has(socket: GLSocket) {
        return this.clients.has(socket);
    }
}

/**
 * Adds a socket to a room by name, creating the room if it doesn't exist
 * @param socket - The socket to add to the room
 * @param name - The name of the room to join
 */
export function joinSocketToRoom(socket: GLSocket, name: string) {
    const rooms = socket.server.rooms;
    const room = rooms.get(name) || rooms.set(name, new Room()).get(name);
    room.join(socket);
}

/**
 * Removes a socket from a room by name
 * @param socket - The socket to remove from the room
 * @param roomName - The name of the room to leave
 */
export function leaveSocketFromRoom(socket: GLSocket, roomName: string) {
    const rooms = socket.server.rooms;
    const room = rooms.get(roomName);
    if (!room) return;
    room.leave(socket);
    if (room.size > 0) return
    rooms.delete(roomName);
}

/**
 * Removes a socket from all rooms it has joined
 * @param socket - The socket to remove from all rooms
 */
export function leaveAllSocketFromRoom(socket: GLSocket) {
    const rooms = socket.server.rooms;
    for (const room of rooms.values()) room.leave(socket);
}