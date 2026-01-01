import { WebSocketServer } from "ws";
import { Server_Opts } from "./types";
import { GLSocket } from "./socket";
import FalconFrame, { Router } from "@wxn0brp/falcon-frame";
import { Room, Rooms } from "./room";

import { Namespace } from "./namespace";

export class GlovesLinkServer {
    public wss: WebSocketServer;
    public logs = false;
    public opts: Server_Opts;
    public initStatusTemp: { [key: string]: number } = {}
    public rooms: Rooms = new Map();

    private namespaces = new Map<string, Namespace>();

    constructor(opts: Partial<Server_Opts>) {
        this.opts = {
            server: null,
            logs: false,
            ...opts
        }

        if (!this.opts?.server) {
            throw new Error("Server is not provided");
        }

        const { server } = opts;

        this.wss = new WebSocketServer({ noServer: true });

        server.on("upgrade", async (request, socket, head) => {
            const headers = request.headers;

            let socketSelfId: string;
            try {
                const url = new URL(request.url!, `http://${request.headers.host}`);
                const token = url.searchParams.get("token");
                socketSelfId = url.searchParams.get("id");
                const { pathname } = url;

                const namespace = this.namespaces.get(pathname);
                if (!namespace) {
                    this.saveSocketStatus(socketSelfId, 404);
                    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
                    socket.destroy();
                    return;
                }

                const authResult = await namespace.authFn({ headers, url, token, request, socket, head });

                if (!authResult) {
                    this.saveSocketStatus(socketSelfId, 401);
                    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
                    socket.destroy();
                    return;
                }

                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    const glSocket = new GLSocket(ws, this);
                    glSocket.logs = this.logs;
                    if (typeof authResult === "object" && authResult !== null) glSocket.user = authResult;

                    glSocket.namespace = pathname;
                    namespace.room.join(glSocket);

                    namespace.onConnectHandler(glSocket);

                    ws.on("close", () => {
                        glSocket.handlers?.disconnect?.();
                        namespace.room.leave(glSocket);
                    });
                });
            } catch (err) {
                if (process.env.NODE_ENV === "development") console.error("[GlovesLinkServer]", err);
                if (this.logs) console.warn("[auth] Error during authentication:", err);
                this.saveSocketStatus(socketSelfId, 500);
                socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
                socket.destroy();
            }
        });
    }

    private saveSocketStatus(socketSelfId: string, status: number) {
        if (!socketSelfId) return;
        this.initStatusTemp[socketSelfId] = status;
        setTimeout(() => {
            delete this.initStatusTemp[socketSelfId];
        }, 10_000);
    }

    of(path: string): Namespace {
        let namespace = this.namespaces.get(path);
        if (!namespace) {
            namespace = new Namespace(path, this);
            this.namespaces.set(path, namespace);
        }
        return namespace;
    }

    broadcastRoom(roomName: string, event: string, ...args: any[]) {
        const room = this.room(roomName);
        if (!room) return;
        room.emit(event, ...args);
    }

    room(name: string): Room {
        return this.rooms.get(name) || this.rooms.set(name, new Room()).get(name);
    }

    falconFrame(app: FalconFrame, clientDir?: string) {
        clientDir = clientDir || "node_modules/@wxn0brp/gloves-link-client/dist/";
        const router = new Router();
        app.use("/gloves-link", router);

        router.static("/", clientDir);
        router.get("/status", (req, res) => {
            const id = req.query.id as string;
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

export {
    GLSocket,
    Namespace,
    Server_Opts
}