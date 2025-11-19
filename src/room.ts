import EventEmitter from "events";
import { GLSocket } from "./socket";

export type Rooms = Map<string, Room>;

export class Room {
    clients: Set<GLSocket> = new Set();
    eventEmitter = new EventEmitter();

    join(socket: GLSocket) {
        this.clients.add(socket);
        this.eventEmitter.emit("join", socket, this);
    }

    leave(socket: GLSocket) {
        this.clients.delete(socket);
        this.eventEmitter.emit("leave", socket, this);
    }

    leaveAll() {
        this.clients.clear();
        this.eventEmitter.emit("leaveAll", this);
    }

    onJoin(handler: (socket: GLSocket, room: Room) => void) {
        this.eventEmitter.on("join", handler);
        return this;
    }

    onLeave(handler: (socket: GLSocket, room: Room) => void) {
        this.eventEmitter.on("leave", handler);
        return this;
    }

    get size() {
        return this.clients.size;
    }

    get sockets() {
        return Array.from(this.clients);
    }

    emit(evtName: string, ...data: any) {
        for (const socket of this.clients) {
            socket.emit(evtName, ...data);
        }
    }

    emitWithoutSelf(socket: GLSocket, evtName: string, ...data: any) {
        for (const client of this.clients) {
            if (client === socket) continue;
            client.emit(evtName, ...data);
        }
    }

    has(socket: GLSocket) {
        return this.clients.has(socket);
    }
}

export function joinSocketToRoom(socket: GLSocket, name: string) {
    const rooms = socket.server.rooms;
    const room = rooms.get(name) || rooms.set(name, new Room()).get(name);
    room.join(socket);
}

export function leaveSocketFromRoom(socket: GLSocket, roomName: string) {
    const rooms = socket.server.rooms;
    const room = rooms.get(roomName);
    if (!room) return;
    room.leave(socket);
    if (room.size > 0) return
    rooms.delete(roomName);
}

export function leaveAllSocketFromRoom(socket: GLSocket) {
    const rooms = socket.server.rooms;
    for (const room of rooms.values()) room.leave(socket);
}