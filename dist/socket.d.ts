import { WebSocket } from "ws";
import { GlovesLinkServer } from "./index.js";
export declare class GLSocket {
    ws: WebSocket;
    server: GlovesLinkServer;
    id: string;
    ackIdCounter: number;
    ackCallbacks: Map<number, Function>;
    logs: boolean;
    handlers: {
        [key: string]: Function;
    };
    rooms: Set<string>;
    constructor(ws: WebSocket, server: GlovesLinkServer, id?: string);
    _handle(raw: string): void;
    on(evt: string, handler: (...args: any[]) => void | any): void;
    emit(evt: string, ...args: any[]): void;
    send(evt: string, ...args: any[]): void;
    close(): void;
    joinRoom(roomName: string): void;
    leaveRoom(roomName: string): void;
    leaveAllRooms(): void;
}
