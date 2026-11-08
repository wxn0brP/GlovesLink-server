import { isPlainObject, isValidEventName, normalizeAckIndexes, parse, stringify, } from "./transport.js";
import VEE from "@wxn0brp/event-emitter";
/**
 * GLSocket class represents a WebSocket connection with additional functionality
 * @template T - The type of user data associated with the socket
 */
export class GLSocket {
    ws;
    server;
    id;
    user;
    namespacePath;
    namespace;
    rooms = new Set();
    ackIdCounter = 1;
    ackCallbacks = new Map();
    logs = false;
    handlers = new VEE();
    authData;
    authResult;
    volatile;
    /**
     * Creates a new GLSocket instance
     * @param ws - The underlying WebSocket connection
     * @param server - The GlovesLinkServer instance
     * @param id - Optional ID for the socket, will be generated if not provided
     */
    constructor(ws, server, id) {
        this.ws = ws;
        this.server = server;
        this.id =
            id ||
                Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        this.user = {
            _id: this.id,
        };
        this.ws.on("message", (raw) => this._handle(raw.toString()));
        this.volatile = {
            emit: (evt, ...args) => {
                if (this.ws.bufferedAmount > this.server.opts.maxBufferedAmount)
                    return;
                this.emit(evt, ...args);
            },
            send: (evt, ...args) => {
                if (this.ws.bufferedAmount > this.server.opts.maxBufferedAmount)
                    return;
                this.emit(evt, ...args);
            },
        };
    }
    /**
     * Internal method to handle incoming messages from the WebSocket
     * @param raw - The raw message string received from the WebSocket
     */
    _handle(raw) {
        try {
            this._process(raw);
        }
        catch (e) {
            if (this.logs)
                console.warn("[ws] Dropped message:", e);
        }
    }
    _process(raw) {
        const msg = parse(raw);
        if (!isPlainObject(msg)) {
            if (this.logs)
                console.warn("[ws] Invalid message:", raw);
            return;
        }
        if ("ack" in msg) {
            const ackId = msg.ack;
            if (!Number.isInteger(ackId) || !Array.isArray(msg.data)) {
                if (this.logs)
                    console.warn("[ws] Invalid ack:", msg);
                return;
            }
            if (this.logs)
                console.log("[ws] Received ack:", ackId);
            const ackCallback = this.ackCallbacks.get(ackId);
            if (ackCallback) {
                this.ackCallbacks.delete(ackId);
                ackCallback(...msg.data);
            }
            return;
        }
        const { evt, data, ackI } = msg;
        if (!isValidEventName(evt)) {
            if (this.logs)
                console.warn("[ws] Invalid event name:", evt);
            return;
        }
        if (data !== undefined && !Array.isArray(data))
            return;
        const args = data ?? [];
        if (this.logs)
            console.log("[ws] Received event:", evt, args);
        const ackIndexes = normalizeAckIndexes(ackI, args.length);
        for (let i = 0; i < ackIndexes.length; i++) {
            const ackIndex = ackIndexes[i];
            const ackId = args[ackIndex];
            if (typeof ackId !== "number")
                continue;
            args[ackIndex] = (...res) => {
                this.ws.send(stringify({
                    ack: ackId,
                    data: res,
                }));
            };
        }
        this.handlers.emit(evt, ...args);
    }
    /**
     * Registers an event handler for the specified event
     * @param evt - The event name to listen for
     * @param handler - The function to be called when the event is received
     */
    on(evt, handler) {
        this.handlers.on(evt, handler);
    }
    /**
     * Sends an event to the connected WebSocket client
     * @param evt - The event name to send
     * @param args - The arguments to pass with the event
     */
    emit(evt, ...args) {
        const ackI = args
            .map((data, i) => {
            if (typeof data === "function")
                return i;
            return undefined;
        })
            .filter(i => i !== undefined);
        for (let i = 0; i < ackI.length; i++) {
            const ackIndex = ackI[i];
            const ackId = this.ackIdCounter++;
            this.ackCallbacks.set(ackId, args[ackIndex]);
            args[ackIndex] = ackId;
        }
        this.ws.send(stringify({
            evt,
            data: args || undefined,
            ackI: ackI.length ? ackI : undefined,
        }));
    }
    /**
     * Sends an event to the connected WebSocket client (alias for emit)
     * @param evt - The event name to send
     * @param args - The arguments to pass with the event
     * @returns The result of the emit method
     */
    send(evt, ...args) {
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
    joinRoom(roomOrName) {
        const room = typeof roomOrName === "string" ? this.room(roomOrName) : roomOrName;
        room.join(this);
    }
    /**
     * Removes the socket from a room
     * @param roomName - The name of the room to leave
     */
    leaveRoom(roomOrName) {
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
    room(name) {
        return this.namespace.room(name);
    }
    /**
     * Gets a room by user ID
     * @returns The room object or undefined if not found
     */
    userRoom() {
        return this.namespace.userRoom(this.user?._id);
    }
}
