import VEE from "@wxn0brp/event-emitter";
import { Namespace } from "./namespace.js";
import { Room } from "./room.js";
import { AuthFnResult, Server_Auth_Opts } from "./types.js";
import type { FFRequest, FFResponse } from "@wxn0brp/falcon-frame";
export declare class SSESocket<T = {
    _id?: string;
}> {
    req: FFRequest;
    res: FFResponse;
    server: any;
    id: string;
    user: T;
    namespacePath: string;
    namespace: Namespace;
    rooms: Set<Room>;
    logs: boolean;
    handlers: VEE<{}>;
    authData: Server_Auth_Opts;
    authResult: AuthFnResult;
    volatile: {
        emit: (evt: string, ...args: any[]) => void;
        send: (evt: string, ...args: any[]) => void;
    };
    constructor(req: FFRequest, res: FFResponse, server: any, id?: string);
    emit(evt: string, ...args: any[]): void;
    send(evt: string, ...args: any[]): void;
    on(evt: string, handler: (...args: any[]) => void | any): void;
    disconnect(): void;
    joinRoom(roomOrName: Room | string): void;
    leaveRoom(roomOrName: Room | string): void;
    leaveAllRooms(): void;
    room(name: string): Room;
    userRoom(): Room;
}
