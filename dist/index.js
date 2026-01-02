import { Router } from "@wxn0brp/falcon-frame";
import { WebSocketServer } from "ws";
import { Namespace } from "./namespace.js";
import { Room } from "./room.js";
import { GLSocket } from "./socket.js";
/**
 * GlovesLinkServer class provides a WebSocket server with namespace and room functionality
 */
export class GlovesLinkServer {
    wss;
    logs = false;
    opts;
    initStatusTemp = {};
    rooms = new Map();
    namespaces = new Map();
    /**
     * Creates a new GlovesLinkServer instance
     * @param opts - Server options including the HTTP server instance
     */
    constructor(opts) {
        this.opts = {
            logs: false,
            ...opts
        };
        this.wss = new WebSocketServer({ noServer: true });
    }
    createServer(server) {
        server.on("upgrade", async (request, socket, head) => {
            const headers = request.headers;
            let socketSelfId;
            try {
                const url = new URL(request.url, `http://${request.headers.host}`);
                const token = url.searchParams.get("token");
                socketSelfId = url.searchParams.get("id");
                const { pathname } = url;
                const namespace = this.namespaces.get(pathname);
                if (!namespace) {
                    this.saveSocketStatus(socketSelfId, pathname, 404);
                    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
                    socket.destroy();
                    return;
                }
                const data = url.searchParams.has("data") ? JSON.parse(url.searchParams.get("data")) : {};
                const authResult = await namespace.authFn({
                    token, data,
                    url, headers,
                    request, socket, head,
                });
                if (!authResult || authResult.status !== 200) {
                    this.saveSocketStatus(socketSelfId, pathname, authResult?.status || 401, authResult?.msg || "Unauthorized");
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                    return;
                }
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    const glSocket = new GLSocket(ws, this);
                    glSocket.logs = this.logs;
                    if (typeof authResult.user === "object" && authResult.user !== null)
                        glSocket.user = authResult.user;
                    glSocket.namespace = pathname;
                    namespace.room.join(glSocket);
                    namespace.onConnectHandler(glSocket);
                    ws.on("close", () => {
                        glSocket.handlers?.disconnect?.();
                        namespace.room.leave(glSocket);
                    });
                });
            }
            catch (err) {
                if (process.env.NODE_ENV === "development")
                    console.error("[GlovesLinkServer]", err);
                if (this.logs)
                    console.warn("[auth] Error during authentication:", err);
                this.saveSocketStatus(socketSelfId, "/", 500);
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
            }
        });
    }
    /**
     * Saves the status of a socket connection for temporary tracking
     * @param socketSelfId - The ID of the socket
     * @param namespace - The namespace of the socket
     * @param status - The status code to save
     * @param msg - Optional message to save with the status
     * @private
     */
    saveSocketStatus(socketSelfId, namespace, status, msg) {
        if (!socketSelfId)
            return;
        const id = namespace + "-" + socketSelfId;
        this.initStatusTemp[id] = {
            status,
            msg
        };
        setTimeout(() => {
            delete this.initStatusTemp[id];
        }, 10_000);
    }
    /**
     * Gets or creates a namespace by path
     * @param path - The path for the namespace
     * @returns The namespace instance
     */
    of(path) {
        let namespace = this.namespaces.get(path);
        if (!namespace) {
            namespace = new Namespace(path, this);
            this.namespaces.set(path, namespace);
        }
        return namespace;
    }
    /**
     * Broadcasts an event to all sockets in a room
     * @param roomName - The name of the room to broadcast to
     * @param event - The event name to broadcast
     * @param args - Arguments to send with the event
     */
    broadcastRoom(roomName, event, ...args) {
        const room = this.room(roomName);
        if (!room)
            return;
        room.emit(event, ...args);
    }
    /**
     * Gets or creates a room by name
     * @param name - The name of the room
     * @returns The room instance
     */
    room(name) {
        return this.rooms.get(name) || this.rooms.set(name, new Room()).get(name);
    }
    /**
     * Creates a router for handling status requests
     * @returns A router instance for status endpoints
     */
    statusRouter() {
        const router = new Router();
        router.get("/status", (req, res) => {
            const id = req.query.id;
            if (!id) {
                res.status(400).json({ err: true, msg: "No id provided" });
                return;
            }
            const path = req.query.path;
            if (!path) {
                res.status(400).json({ err: true, msg: "No path provided" });
                return;
            }
            const status = this.initStatusTemp[path + "-" + id];
            if (status === undefined) {
                res.status(404).json({ err: true, msg: "Socket not found" });
                return;
            }
            res.json({ status });
            delete this.initStatusTemp[id];
        });
        return router;
    }
    /**
     * Creates a router for serving client files
     * @param clientDir - Optional directory path for client files, defaults to node_modules/@wxn0brp/gloves-link-client/dist/
     * @returns A router instance for client file serving
     */
    clientRouter(clientDir) {
        const router = new Router();
        clientDir = clientDir || "node_modules/@wxn0brp/gloves-link-client/dist/";
        router.static("/", clientDir);
        router.get("/*", (req, res) => {
            res.redirect("/gloves-link/GlovesLinkClient.js");
            res.end();
        });
        return router;
    }
    /**
     * Integrates the GlovesLink server with a FalconFrame application
     * @param app - The FalconFrame application instance
     * @param clientDir - Optional directory path for client files, or false to disable client serving
     */
    falconFrame(app, clientDir) {
        const router = new Router();
        app.use("/gloves-link", router);
        router.use(this.statusRouter());
        if (clientDir !== false)
            router.use(this.clientRouter(clientDir));
    }
}
export { GLSocket, Namespace };
