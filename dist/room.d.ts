import EventEmitter from "events";
import { GLSocket } from "./socket.js";
export type Rooms = Map<string, Room>;
/**
 * Room class represents a collection of sockets that can communicate with each other
 */
export declare class Room {
    clients: Set<GLSocket>;
    eventEmitter: EventEmitter<any>;
    /**
     * Adds a socket to the room
     * @param socket - The socket to add to the room
     */
    join(socket: GLSocket): void;
    /**
     * Removes a socket from the room
     * @param socket - The socket to remove from the room
     */
    leave(socket: GLSocket): void;
    /**
     * Removes all sockets from the room
     */
    leaveAll(): void;
    /**
     * Registers a handler for when a socket joins the room
     * @param handler - The function to be called when a socket joins the room
     * @returns The current Room instance for chaining
     */
    onJoin(handler: (socket: GLSocket, room: Room) => void): this;
    /**
     * Registers a handler for when a socket leaves the room
     * @param handler - The function to be called when a socket leaves the room
     * @returns The current Room instance for chaining
     */
    onLeave(handler: (socket: GLSocket, room: Room) => void): this;
    /**
     * Gets the number of clients in the room
     * @returns The number of clients in the room
     */
    get size(): number;
    /**
     * Gets an array of all clients in the room
     * @returns An array containing all the sockets in the room
     */
    get sockets(): GLSocket<{
        _id?: string;
    }>[];
    /**
     * Emits an event to all clients in the room
     * @param evtName - The name of the event to emit
     * @param data - The data to send with the event
     */
    emit(evtName: string, ...data: any): void;
    /**
     * Emits an event to all clients in the room except the specified socket
     * @param socket - The socket to exclude from the emission
     * @param evtName - The name of the event to emit
     * @param data - The data to send with the event
     */
    emitWithoutSelf(socket: GLSocket, evtName: string, ...data: any): void;
    /**
     * Checks if a socket is in the room
     * @param socket - The socket to check
     * @returns True if the socket is in the room, false otherwise
     */
    has(socket: GLSocket): boolean;
}
/**
 * Adds a socket to a room by name, creating the room if it doesn't exist
 * @param socket - The socket to add to the room
 * @param name - The name of the room to join
 */
export declare function joinSocketToRoom(socket: GLSocket, name: string): void;
/**
 * Removes a socket from a room by name
 * @param socket - The socket to remove from the room
 * @param roomName - The name of the room to leave
 */
export declare function leaveSocketFromRoom(socket: GLSocket, roomName: string): void;
/**
 * Removes a socket from all rooms it has joined
 * @param socket - The socket to remove from all rooms
 */
export declare function leaveAllSocketFromRoom(socket: GLSocket): void;
