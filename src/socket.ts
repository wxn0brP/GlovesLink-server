import { WebSocket } from "ws";
import { GlovesLinkServer, Namespace } from ".";
import { Room } from "./room";
import { AuthFnResult, Server_Auth_Opts } from "./types";
import { parse, stringify } from "./transport";
import EventEmitter from "events";

/**
 * GLSocket class represents a WebSocket connection with additional functionality
 * @template T - The type of user data associated with the socket
 */
export class GLSocket<T = { _id?: string }> {
    public id: string;
    public user: T;

    public namespacePath: string;
    public namespace: Namespace;
    public rooms: Set<Room> = new Set();

    public ackIdCounter = 1;
    public ackCallbacks: Map<number, Function> = new Map();
    public logs = false;

    public handlers = new EventEmitter();
    public authData: Server_Auth_Opts;
    public authResult: AuthFnResult;
    public dataFormatType: "json" | "bin" = "json";

    /**
     * Creates a new GLSocket instance
     * @param ws - The underlying WebSocket connection
     * @param server - The GlovesLinkServer instance
     * @param id - Optional ID for the socket, will be generated if not provided
     */
    constructor(
        public ws: WebSocket,
        public server: GlovesLinkServer,
        id?: string
    ) {
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        this.user = { _id: this.id } as T;
        this.ws.on("message", (raw: string) => this._handle(raw.toString()));
    }

    /**
     * Internal method to handle incoming messages from the WebSocket
     * @param raw - The raw message string received from the WebSocket
     */
    _handle(raw: string) {
        const msg = parse(this.dataFormatType, raw);

        if (!msg) {
            if (this.logs) console.warn(`[ws] Invalid format (${this.dataFormatType}):`, raw);
            return;
        }

        if ("ack" in msg) {
            const ackId = msg.ack;
            if (this.logs) console.log("[ws] Received ack:", ackId);
            const ackCallback = this.ackCallbacks.get(ackId);
            if (ackCallback) {
                this.ackCallbacks.delete(ackId);
                ackCallback(...msg.data);
            }
            return;
        }

        const { evt, data, ackI } = msg;
        if (!evt || (data && !Array.isArray(data))) return;
        if (this.logs) console.log("[ws] Received event:", evt, data);

        if (Array.isArray(ackI)) {
            for (let i = 0; i < ackI.length; i++) {
                const ackIndex = ackI[i];
                if (!data[ackIndex]) break;

                const ackId = data[ackIndex];
                data[ackIndex] = (...res: any) => {
                    this.ws.send(stringify(this.dataFormatType, { ack: ackId, data: res }));
                }
            }
        }

        this.handlers[evt]?.(...data);
    }

    /**
     * Registers an event handler for the specified event
     * @param evt - The event name to listen for
     * @param handler - The function to be called when the event is received
     */
    on(evt: string, handler: (...args: any[]) => void | any) {
        this.handlers.on(evt, handler);
    }

    /**
     * Sends an event to the connected WebSocket client
     * @param evt - The event name to send
     * @param args - The arguments to pass with the event
     */
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

        this.ws.send(stringify(this.dataFormatType, {
            evt,
            data: args || undefined,
            ackI: ackI.length ? ackI : undefined
        }));
    }

    /**
     * Sends an event to the connected WebSocket client (alias for emit)
     * @param evt - The event name to send
     * @param args - The arguments to pass with the event
     * @returns The result of the emit method
     */
    send(evt: string, ...args: any[]) {
        return this.emit(evt, ...args);
    }

    /**
     * Closes the WebSocket connection
     */
    disconnect() {
        this.ws.close();
    }

    /**
     * Joins the socket to a room
     * @param roomName - The name of the room to join
     */
    joinRoom(roomOrName: Room | string) {
        const room = typeof roomOrName === "string" ? this.room(roomOrName) : roomOrName;
        room.join(this);
    }

    /**
     * Removes the socket from a room
     * @param roomName - The name of the room to leave
     */
    leaveRoom(roomOrName: Room | string) {
        const room = typeof roomOrName === "string" ? this.room(roomOrName) : roomOrName;
        room.leave(this);
    }

    /**
     * Removes the socket from all rooms it has joined
     */
    leaveAllRooms() {
        for (const room of this.rooms.values())
            room.leave(this);
    }

    /**
     * Gets a room by name
     * @param name - The name of the room to get
     * @returns The room object or undefined if not found
     */
    room(name: string) {
        return this.namespace.room(name);
    }
}