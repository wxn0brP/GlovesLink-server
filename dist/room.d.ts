import EventEmitter from "events";
import { GLSocket } from "./socket.js";
export type Rooms = Map<string, Room>;
export declare class Room {
    clients: Set<GLSocket>;
    eventEmitter: EventEmitter<[never]>;
    join(socket: GLSocket): void;
    leave(socket: GLSocket): void;
    leaveAll(): void;
    onJoin(handler: (socket: GLSocket, room: Room) => void): this;
    onLeave(handler: (socket: GLSocket, room: Room) => void): this;
    get size(): number;
    get sockets(): GLSocket[];
    emit(evtName: string, ...data: any): void;
    emitWithoutSelf(socket: GLSocket, evtName: string, ...data: any): void;
    has(socket: GLSocket): boolean;
}
export declare function joinSocketToRoom(socket: GLSocket, name: string): void;
export declare function leaveSocketFromRoom(socket: GLSocket, roomName: string): void;
export declare function leaveAllSocketFromRoom(socket: GLSocket): void;
