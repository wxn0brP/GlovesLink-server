import VEE from "@wxn0brp/event-emitter";
export class SSESocket {
    req;
    res;
    server;
    id;
    user;
    namespacePath;
    namespace;
    rooms = new Set();
    logs = false;
    handlers = new VEE();
    authData;
    authResult;
    volatile;
    constructor(req, res, server, id) {
        this.req = req;
        this.res = res;
        this.server = server;
        this.id =
            id ||
                Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        this.user = {
            _id: this.id,
        };
        this.volatile = {
            emit: (evt, ...args) => {
                this.emit(evt, ...args);
            },
            send: (evt, ...args) => {
                this.emit(evt, ...args);
            },
        };
    }
    emit(evt, ...args) {
        this.res.sseSend({
            evt,
            data: args,
        });
    }
    send(evt, ...args) {
        return this.emit(evt, ...args);
    }
    on(evt, handler) {
        this.handlers.on(evt, handler);
    }
    disconnect() {
        this.res.end();
    }
    joinRoom(roomOrName) {
        const room = typeof roomOrName === "string" ? this.room(roomOrName) : roomOrName;
        room.join(this);
    }
    leaveRoom(roomOrName) {
        const room = typeof roomOrName === "string" ? this.room(roomOrName) : roomOrName;
        room.leave(this);
    }
    leaveAllRooms() {
        for (const room of this.rooms.values())
            room.leave(this);
    }
    room(name) {
        return this.namespace.room(name);
    }
    userRoom() {
        return this.namespace.userRoom(this.user?._id);
    }
}
