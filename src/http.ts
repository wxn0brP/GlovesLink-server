import { Router } from "@wxn0brp/falcon-frame";
import { SocketStatus } from "./types";
import { GlovesLinkServer } from ".";

/**
 * Saves the status of a socket connection for temporary tracking
 */
export function saveSocketStatus(wss: GlovesLinkServer, socketStatus: SocketStatus) {
    const {
        namespace,
        socketSelfId,
        status,
        msg
    } = socketStatus;

    if (!socketSelfId) return;

    const id = namespace + "-" + socketSelfId;
    wss.initStatusTemp[id] = {
        status,
        msg
    }
    setTimeout(() => {
        delete wss.initStatusTemp[id];
    }, wss.opts.statusTimeout);
}

/**
 * Creates a router for handling status requests
 * @returns A router instance for status endpoints
 */
export function statusRouter() {
    const router = new Router();

    router.get("/status", (req, res) => {
        const id = req.query.id as string;
        if (!id) {
            res.status(400).json({ err: true, msg: "No id provided" });
            return;
        }

        const path = req.query.path as string;
        if (!path) {
            res.status(400).json({ err: true, msg: "No path provided" });
            return;
        }

        const statusKey = path + "-" + id;
        const status = this.initStatusTemp[statusKey];
        if (status === undefined) {
            res.status(404).json({ err: true, msg: "Socket not found" });
            return;
        }
        res.json({ err: false, status });
        delete this.initStatusTemp[statusKey];
    });

    return router;
}

/**
 * Creates a router for serving client files
 * @param clientDir - Optional directory path for client files, defaults to node_modules/@wxn0brp/gloves-link-client/dist/
 * @returns A router instance for client file serving
 */
export function clientRouter(clientDir?: string) {
    const router = new Router();

    clientDir = clientDir || "node_modules/@wxn0brp/gloves-link-client/dist/";
    router.static("/", clientDir);
    router.get("/*", (req, res) => {
        res.redirect("/gloves-link/GlovesLinkClient.js");
        res.end();
    });

    return router;
}