import { Router } from "@wxn0brp/falcon-frame";
import { SocketStatus } from "./types.js";
import { GlovesLinkServer } from "./index.js";
/**
 * Saves the status of a socket connection for temporary tracking
 */
export declare function saveSocketStatus(wss: GlovesLinkServer, socketStatus: SocketStatus): void;
/**
 * Creates a router for handling status requests
 * @returns A router instance for status endpoints
 */
export declare function statusRouter(): Router;
/**
 * Creates a router for serving client files
 * @param clientDir - Optional directory path for client files, defaults to node_modules/@wxn0brp/gloves-link-client/dist/
 * @returns A router instance for client file serving
 */
export declare function clientRouter(clientDir?: string): Router;
