import EventEmitter from "events";
import { GLSocket } from "./socket.js";
export type Rooms = Map<string, Room>;
/**
 * Room class represents a collection of sockets that can communicate with each other
 */
export declare class Room {
    _clients: Set<GLSocket>;
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
 * Gets or creates a room by name
 * @param rooms - The map of rooms to search in
 * @param name - The name of the room to get or create
 * @returns The Room instance
 */
export declare function getRoom(rooms: Rooms, name: string): Room;
