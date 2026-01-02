import { WebSocket } from "ws";
import { GlovesLinkServer } from ".";
import { joinSocketToRoom, leaveSocketFromRoom } from "./room";
import { Server_AckEvent, Server_DataEvent } from "./types";

export class GLSocket<T = { _id?: string }> {
    public id: string;
    public user: T;
    public namespace: string;
    ackIdCounter = 1;
    ackCallbacks: Map<number, Function> = new Map();
    logs = false;
    public handlers: { [key: string]: Function };
    public rooms: Set<string> = new Set();

    constructor(
        public ws: WebSocket,
        public server: GlovesLinkServer,
        id?: string
    ) {
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        this.user = { _id: this.id } as T;
        this.handlers = {};
        this.ws.on("message", (raw: string) => this._handle(raw));
    }

    _handle(raw: string) {
        let msg: Server_DataEvent | Server_AckEvent;

        try {
            msg = JSON.parse(raw);
        } catch {
            if (this.logs) console.warn("[ws] Invalid JSON:", raw);
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
        if (!evt || (data && !Array.isArray(data))) return;

        if (Array.isArray(ackI)) {
            for (let i = 0; i < ackI.length; i++) {
                const ackIndex = ackI[i];
                if (!data[ackIndex]) break;

                const ackId = data[ackIndex];
                data[ackIndex] = (...res: any) => {
                    this.ws.send(JSON.stringify({ ack: ackId, data: res }));
                }
            }
        }

        this.handlers[evt]?.(...data);
    }

    on(evt: string, handler: (...args: any[]) => void | any) {
        this.handlers[evt] = handler;
    }

    emit(evt: string, ...args: any[]) {
        const ackI = args.map((data, i) => {
            if (typeof data === "function") return i;
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

    send(evt: string, ...args: any[]) {
        return this.emit(evt, ...args);
    }

    close() {
        this.ws.close();
    }

    joinRoom(roomName: string) {
        joinSocketToRoom(this, roomName);
        this.rooms.add(roomName);
    }

    leaveRoom(roomName: string) {
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