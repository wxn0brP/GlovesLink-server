import { WebSocketServer } from "ws";
import { GLSocket } from "./socket.js";
import { Router } from "@wxn0brp/falcon-frame";
import { Room } from "./room.js";
export class GlovesLinkServer {
    wss;
    onConnectEvent;
    logs = false;
    opts;
    initStatusTemp = {};
    rooms = new Map();
    globalRoom = new Room();
    constructor(opts) {
        this.opts = {
            server: null,
            logs: false,
            authFn: () => true,
            ...opts
        };
        if (!this.opts?.server) {
            throw new Error("Server is not provided");
        }
        const { server } = opts;
        this.wss = new WebSocketServer({ noServer: true });
        server.on("upgrade", async (request, socket, head) => {
            const headers = request.headers;
            let socketSelfId;
            try {
                const url = new URL(request.url, `http://${request.headers.host}`);
                const token = url.searchParams.get("token");
                socketSelfId = url.searchParams.get("id");
                const isAuthenticated = await this.opts.authFn({ headers, url, token });
                if (!isAuthenticated) {
                    this.saveSocketStatus(socketSelfId, 401);
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                    return;
                }
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    const glSocket = new GLSocket(ws, this);
                    glSocket.logs = this.logs;
                    this.globalRoom.join(glSocket);
                    this.onConnectEvent(glSocket);
                    ws.on("close", () => {
                        glSocket.handlers?.disconnect?.();
                        glSocket.leaveAllRooms();
                        this.globalRoom.leave(glSocket);
                    });
                });
            }
            catch (err) {
                if (process.env.NODE_ENV === "development")
                    console.error("[GlovesLinkServer]", err);
                if (this.logs)
                    console.warn("[auth] Error during authentication:", err);
                this.saveSocketStatus(socketSelfId, 500);
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
            }
        });
    }
    saveSocketStatus(socketSelfId, status) {
        if (!socketSelfId)
            return;
        this.initStatusTemp[socketSelfId] = status;
        setTimeout(() => {
            delete this.initStatusTemp[socketSelfId];
        }, 10_000);
    }
    onConnect(handler) {
        this.onConnectEvent = handler;
    }
    broadcast(event, ...args) {
        this.globalRoom.emit(event, ...args);
    }
    broadcastRoom(roomName, event, ...args) {
        const room = this.room(roomName);
        if (!room)
            return;
        room.emit(event, ...args);
    }
    broadcastWithoutSelf(socket, event, ...args) {
        this.globalRoom.emitWithoutSelf(socket, event, ...args);
    }
    room(name) {
        return this.rooms.get(name) || this.rooms.set(name, new Room()).get(name);
    }
    falconFrame(app, clientDir) {
        clientDir = clientDir || "node_modules/@wxn0brp/gloves-link-client/dist/";
        const router = new Router();
        app.use("/gloves-link", router);
        router.static("/", clientDir);
        router.get("/status", (req, res) => {
            const id = req.query.id;
            if (!id) {
                res.status(400).json({ err: true, msg: "No id provided" });
                return;
            }
            const status = this.initStatusTemp[id];
            if (status === undefined) {
                res.status(404).json({ err: true, msg: "Socket not found" });
                return;
            }
            res.json({ status });
            delete this.initStatusTemp[id];
        });
        router.get("/*", (req, res) => {
            res.redirect("/gloves-link/GlovesLinkClient.js");
            res.end();
        });
    }
}
export { GLSocket };
