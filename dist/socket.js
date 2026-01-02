import { joinSocketToRoom, leaveSocketFromRoom } from "./room.js";
/**
 * GLSocket class represents a WebSocket connection with additional functionality
 * @template T - The type of user data associated with the socket
 */
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
    authData;
    authResult;
    /**
     * Creates a new GLSocket instance
     * @param ws - The underlying WebSocket connection
     * @param server - The GlovesLinkServer instance
     * @param id - Optional ID for the socket, will be generated if not provided
     */
    constructor(ws, server, id) {
        this.ws = ws;
        this.server = server;
        this.id = id || Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
        this.user = { _id: this.id };
        this.handlers = {};
        this.ws.on("message", (raw) => this._handle(raw));
    }
    /**
     * Internal method to handle incoming messages from the WebSocket
     * @param raw - The raw message string received from the WebSocket
     */
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
    /**
     * Registers an event handler for the specified event
     * @param evt - The event name to listen for
     * @param handler - The function to be called when the event is received
     */
    on(evt, handler) {
        this.handlers[evt] = handler;
    }
    /**
     * Sends an event to the connected WebSocket client
     * @param evt - The event name to send
     * @param args - The arguments to pass with the event
     */
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
    close() {
        this.ws.close();
    }
    /**
     * Joins the socket to a room
     * @param roomName - The name of the room to join
     */
    joinRoom(roomName) {
        joinSocketToRoom(this, roomName);
        this.rooms.add(roomName);
    }
    /**
     * Removes the socket from a room
     * @param roomName - The name of the room to leave
     */
    leaveRoom(roomName) {
        leaveSocketFromRoom(this, roomName);
        this.rooms.delete(roomName);
    }
    /**
     * Removes the socket from all rooms it has joined
     */
    leaveAllRooms() {
        for (const roomName of this.rooms) {
            leaveSocketFromRoom(this, roomName);
        }
        this.rooms.clear();
    }
    /**
     * Gets the namespace associated with this socket
     * @returns The namespace object or undefined if not found
     */
    getNamespace() {
        return this.server.namespaces.get(this.namespace);
    }
    /**
     * Gets the room associated with this socket's namespace
     * @returns The room object or undefined if namespace is not found
     */
    namespaceRoom() {
        return this.getNamespace()?.room;
    }
    /**
     * Gets a room from the server by name
     * @param roomName - The name of the room to retrieve
     * @returns The room object
     */
    serverRoom(roomName) {
        return this.server.room(roomName);
    }
    /**
     * Gets all rooms from the server
     * @returns A map of all rooms on the server
     */
    serverRooms() {
        return this.server.rooms;
    }
}
