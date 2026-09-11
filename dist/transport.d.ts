import { Server_AckEvent, Server_DataEvent } from "./types.js";
export declare function parse(type: string, raw: string): Server_DataEvent | Server_AckEvent;
export declare function stringify(type: "json" | "bin", data: any): string;
