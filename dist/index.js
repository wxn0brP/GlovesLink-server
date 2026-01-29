import { Router } from "@wxn0brp/falcon-frame";
import { WebSocketServer } from "ws";
import { clientRouter, saveSocketStatus, statusRouter } from "./http.js";
import { Namespace } from "./namespace.js";
import { getRoom } from "./room.js";
import { GLSocket } from "./socket.js";
/**
 * GlovesLinkServer class provides a WebSocket server with namespace and room functionality
 */
export class GlovesLinkServer {
    wss;
    opts;
    initStatusTemp = {};
    namespaces = new Map();
    /**
     * Creates a new GlovesLinkServer instance
     * @param opts - Server options including the HTTP server instance
     */
    constructor(opts) {
        this.opts = {
            logs: false,
            statusTimeout: 10_000,
            ...opts
        };
        this.wss = new WebSocketServer({ noServer: true });
    }
    attachToHttpServer(server) {
        server.on("upgrade", async (request, socket, head) => {
            const headers = request.headers;
            let socketSelfId;
            try {
                const url = new URL(request.url, `http://${request.headers.host}`);
                const token = url.searchParams.get("token");
                socketSelfId = url.searchParams.get("id");
                const type = url.searchParams.get("type");
                const { pathname } = url;
                const namespace = this.namespaces.get(pathname);
                if (!namespace) {
                    saveSocketStatus(this, {
                        socketSelfId,
                        namespace: pathname,
                        status: 404
                    });
                    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
                    socket.destroy();
                    return;
                }
                const data = url.searchParams.has("data") ? JSON.parse(url.searchParams.get("data")) : {};
                const authData = {
                    token, data,
                    url, headers,
                    request, socket, head,
                };
                const authResult = await namespace._authFn(authData);
                if (!authResult || authResult.status !== 200) {
                    saveSocketStatus(this, {
                        socketSelfId,
                        namespace: pathname,
                        status: authResult?.status || 401,
                        msg: authResult?.msg || "Unauthorized"
                    });
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                    return;
                }
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    const glSocket = new GLSocket(ws, this);
                    glSocket.logs = this.opts.logs;
                    glSocket.authData = authData;
                    glSocket.authResult = authResult;
                    glSocket.dataFormatType = type && ["json", "bin"].includes(type) ? type : "json";
                    if (typeof authResult.user === "object" && authResult.user !== null)
                        glSocket.user = authResult.user;
                    glSocket.namespacePath = pathname;
                    glSocket.namespace = namespace;
                    namespace._room.join(glSocket);
                    const userId = authResult?.user?._id;
                    if (userId)
                        getRoom(namespace.users, userId).join(glSocket);
                    namespace._onConnectHandler(glSocket, authData, authResult);
                    ws.on("close", () => {
                        glSocket.handlers.emit("disconnect");
                        namespace._room.leave(glSocket);
                        glSocket.leaveAllRooms();
                        if (userId) {
                            const room = getRoom(namespace.users, userId);
                            room.leave(glSocket);
                        }
                    });
                });
            }
            catch (err) {
                if (process.env.NODE_ENV === "development")
                    console.error("[GlovesLinkServer]", err);
                if (this.opts.logs)
                    console.warn("[ws auth] Error during authentication:", err);
                saveSocketStatus(this, {
                    socketSelfId,
                    namespace: "/",
                    status: 500
                });
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
            }
        });
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
     * Gets or creates a room by name (from the root namespace)
     * @param name - The name of the room
     * @returns The room instance
     */
    room(name) {
        return this.of("/").room(name);
    }
    /**
     * Gets or creates a room by user ID (from the root namespace)
     * @param userId - The user ID
     * @returns The room instance
     */
    userRoom(userId) {
        return this.of("/").userRoom(userId);
    }
    /**
     * Emits an event to the socket associated with the specified user ID
     * @param userId - The user ID to target
     * @param event - The event name to emit
     * @param args - The arguments to pass with the event
     */
    emitToUserId(userId, event, ...args) {
        this.namespaces.forEach((ns) => ns.emitToUserId(userId, event, ...args));
    }
    /**
     * Integrates the GlovesLink server with a FalconFrame application
     * @param app - The FalconFrame application instance
     * @param clientDir - Optional directory path for client files, or false to disable client serving
     */
    falconFrame(app, clientDir) {
        const router = new Router();
        app.use("/gloves-link", router);
        router.use(statusRouter());
        if (clientDir !== false)
            router.use(clientRouter(clientDir));
    }
}
export { GLSocket, Namespace };
