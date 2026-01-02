import { WebSocket } from "ws";
import { GlovesLinkServer } from ".";
import { joinSocketToRoom, leaveSocketFromRoom, Room, Rooms } from "./room";
import { AuthFnResult, Server_AckEvent, Server_Auth_Opts, Server_DataEvent } from "./types";

/**
 * GLSocket class represents a WebSocket connection with additional functionality
 * @template T - The type of user data associated with the socket
 */
export class GLSocket<T = { _id?: string }> {
    public id: string;
    public user: T;
    public namespace: string;
    ackIdCounter = 1;
    ackCallbacks: Map<number, Function> = new Map();
    logs = false;
    public handlers: { [key: string]: Function };
    public rooms: Set<string> = new Set();
    public authData: Server_Auth_Opts;
    public authResult: AuthFnResult;

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
        this.handlers = {};
        this.ws.on("message", (raw: string) => this._handle(raw));
    }

    /**
     * Internal method to handle incoming messages from the WebSocket
     * @param raw - The raw message string received from the WebSocket
     */
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
                    this.ws.send(JSON.stringify({ ack: ackId, data: res }));
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
        this.handlers[evt] = handler;
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
    send(evt: string, ...args: any[]) {
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
    joinRoom(roomName: string) {
        joinSocketToRoom(this, roomName);
        this.rooms.add(roomName);
    }

    /**
     * Removes the socket from a room
     * @param roomName - The name of the room to leave
     */
    leaveRoom(roomName: string) {
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
    serverRoom(roomName: string) {
        return this.server.room(roomName);
    }

    /**
     * Gets all rooms from the server
     * @returns A map of all rooms on the server
     */
    serverRooms() {
        return this.server.rooms;
    }

    disconnect() {
        this.ws.close();
    }
}