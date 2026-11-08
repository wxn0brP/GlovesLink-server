import { Server_AckEvent, Server_DataEvent } from "./types.js";
export declare function isPlainObject(value: unknown): value is Record<string, any>;
export declare function isValidEventName(evt: unknown): evt is string;
export declare function normalizeAckIndexes(ackI: unknown, dataLength: number): number[];
export declare function parse(raw: string): Server_DataEvent | Server_AckEvent | null;
export declare function stringify(data: any): string;
