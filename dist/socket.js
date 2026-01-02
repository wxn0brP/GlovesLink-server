import { joinSocketToRoom, leaveSocketFromRoom } from "./room.js";
export class GLSocket {
    ws;
    server;
    id;
    user;
    namespace;
    ackIdCounter = 1;
    ackCallbacks = new Map();
    logs = false;
    handlers;
    rooms = new Set();
    constructor(ws, server, id) {
        this.ws = ws;
        this.server = server;
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        this.user = { _id: this.id };
        this.handlers = {};
        this.ws.on("message", (raw) => this._handle(raw));
    }
    _handle(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        }
        catch {
            if (this.logs)
                console.warn("[ws] Invalid JSON:", raw);
            return;
        }
        if ("ack" in msg) {
            const ackId = msg.ack;
            const ackCallback = this.ackCallbacks.get(ackId);
            if (ackCallback) {
                this.ackCallbacks.delete(ackId);
                ackCallback(...msg.data);
            }
            return;
        }
        const { evt, data, ackI } = msg;
        if (!evt || (data && !Array.isArray(data)))
            return;
        if (Array.isArray(ackI)) {
            for (let i = 0; i < ackI.length; i++) {
                const ackIndex = ackI[i];
                if (!data[ackIndex])
                    break;
                const ackId = data[ackIndex];
                data[ackIndex] = (...res) => {
                    this.ws.send(JSON.stringify({ ack: ackId, data: res }));
                };
            }
        }
        this.handlers[evt]?.(...data);
    }
    on(evt, handler) {
        this.handlers[evt] = handler;
    }
    emit(evt, ...args) {
        const ackI = args.map((data, i) => {
            if (typeof data === "function")
                return i;
        }).filter(i => i !== undefined);
        for (let i = 0; i < ackI.length; i++) {
            const ackIndex = ackI[i];
            const ackId = this.ackIdCounter++;
            this.ackCallbacks.set(ackId, args[ackIndex]);
            args[ackIndex] = ackId;
        }
        this.ws.send(JSON.stringify({
            evt,
            data: args || undefined,
            ackI: ackI.length ? ackI : undefined
        }));
    }
    send(evt, ...args) {
        return this.emit(evt, ...args);
    }
    close() {
        this.ws.close();
    }
    joinRoom(roomName) {
        joinSocketToRoom(this, roomName);
        this.rooms.add(roomName);
    }
    leaveRoom(roomName) {
        leaveSocketFromRoom(this, roomName);
        this.rooms.delete(roomName);
    }
    leaveAllRooms() {
        for (const roomName of this.rooms) {
            leaveSocketFromRoom(this, roomName);
        }
        this.rooms.clear();
    }
    getNamespace() {
        return this.server.namespaces.get(this.namespace);
    }
}
