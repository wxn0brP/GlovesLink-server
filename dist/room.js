import EventEmitter from "events";
export class Room {
    clients = new Set();
    eventEmitter = new EventEmitter();
    join(socket) {
        this.clients.add(socket);
        this.eventEmitter.emit("join", socket, this);
    }
    leave(socket) {
        this.clients.delete(socket);
        this.eventEmitter.emit("leave", socket, this);
    }
    leaveAll() {
        this.clients.clear();
        this.eventEmitter.emit("leaveAll", this);
    }
    onJoin(handler) {
        this.eventEmitter.on("join", handler);
        return this;
    }
    onLeave(handler) {
        this.eventEmitter.on("leave", handler);
        return this;
    }
    get size() {
        return this.clients.size;
    }
    get sockets() {
        return Array.from(this.clients);
    }
    emit(evtName, ...data) {
        for (const socket of this.clients) {
            socket.emit(evtName, ...data);
        }
    }
    emitWithoutSelf(socket, evtName, ...data) {
        for (const client of this.clients) {
            if (client === socket)
                continue;
            client.emit(evtName, ...data);
        }
    }
    has(socket) {
        return this.clients.has(socket);
    }
}
export function joinSocketToRoom(socket, name) {
    const rooms = socket.server.rooms;
    const room = rooms.get(name) || rooms.set(name, new Room()).get(name);
    room.join(socket);
}
export function leaveSocketFromRoom(socket, roomName) {
    const rooms = socket.server.rooms;
    const room = rooms.get(roomName);
    if (!room)
        return;
    room.leave(socket);
    if (room.size > 0)
        return;
    rooms.delete(roomName);
}
export function leaveAllSocketFromRoom(socket) {
    const rooms = socket.server.rooms;
    for (const room of rooms.values())
        room.leave(socket);
}
