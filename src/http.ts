import { Router } from "@wxn0brp/falcon-frame";
import { SSEManager } from "@wxn0brp/falcon-frame/sse";
import { GlovesLinkServer } from ".";
import { SocketStatus } from "./types";
import { SSESocket } from "./sse";
import { getRoom } from "./room";
import { isValidEventName } from "./transport";

/**
 * Saves the status of a socket connection for temporary tracking
 */
export function saveSocketStatus(
	wss: GlovesLinkServer,
	socketStatus: SocketStatus,
) {
	const { namespace, socketSelfId, status, msg } = socketStatus;

	if (!socketSelfId) return;

	const id = namespace + "-" + socketSelfId;
	wss.initStatusTemp.set(id, {
		status,
		msg,
		expiresAt: Date.now() + wss.opts.statusTimeout,
	});

	while (wss.initStatusTemp.size > wss.opts.maxStatusEntries) {
		const oldest = wss.initStatusTemp.keys().next();
		if (oldest.done) break;
		wss.initStatusTemp.delete(oldest.value);
	}
}

/**
 * Creates a router for handling status requests
 * @returns A router instance for status endpoints
 */
export function statusRouter(wss: GlovesLinkServer) {
	const router = new Router();

	router.get("/status", (req, res) => {
		const id = req.query.id as string;
		if (!id) {
			res.status(400).json({
				err: true,
				msg: "No id provided",
			});
			return;
		}

		const path = req.query.path as string;
		if (!path) {
			res.status(400).json({
				err: true,
				msg: "No path provided",
			});
			return;
		}

		const statusKey = path + "-" + id;
		const entry = wss.initStatusTemp.get(statusKey);
		if (!entry || entry.expiresAt <= Date.now()) {
			wss.initStatusTemp.delete(statusKey);
			res.status(404).json({
				err: true,
				msg: "Socket not found",
			});
			return;
		}

		wss.initStatusTemp.delete(statusKey);
		res.json({
			err: false,
			status: {
				status: entry.status,
				msg: entry.msg,
			},
		});
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

export function sseRouter(wss: GlovesLinkServer) {
	const router = new Router();
	const sseManager = new SSEManager();

	router.get(
		"/sse/*",
		sseManager.getMiddleware(async (req, res) => {
			try {
				const pathname = req.path.replace("/sse", "");
				const namespace = wss.namespaces.get(pathname);

				if (!namespace) {
					res.status(404).json({
						err: true,
						msg: "Namespace not found",
					});
					sseManager.disconnect(req.sseId!);
					return;
				}

				wss._warnIfNoAuth(namespace);

				const token = req.query.token as string;
				const data = req.query.data ? JSON.parse(req.query.data as string) : {};

				const authData: any = {
					token,
					data,
					url: new URL(req.url!, `http://${req.headers.host}`),
					headers: req.headers,
					request: req,
					socket: res.socket,
					head: Buffer.alloc(0),
				};

				const authResult = await namespace._authFn(authData);

				if (!authResult || authResult.status !== 200) {
					res.status(authResult?.status || 401).json({
						err: true,
						msg: authResult?.msg || "Unauthorized",
					});
					sseManager.disconnect(req.sseId!);
					return;
				}

				const sseSocket = new SSESocket(req, res, wss);
				sseSocket.logs = wss.opts.logs;
				sseSocket.authData = authData;
				sseSocket.authResult = authResult;
				sseSocket.namespacePath = pathname;
				sseSocket.namespace = namespace;

				if (typeof authResult.user === "object" && authResult.user !== null)
					sseSocket.user = authResult.user;

				namespace._room.join(sseSocket as any);
				const userId = authResult?.user?._id;
				if (userId) getRoom(namespace.users, userId).join(sseSocket as any);

				namespace._sseClients.set(req.sseId!, sseSocket);

				namespace._onConnectHandler(sseSocket as any, authData, authResult);

				req.on("close", () => {
					sseSocket.handlers.emit("disconnect");
					namespace._room.leave(sseSocket as any);
					sseSocket.leaveAllRooms();
					namespace._sseClients.delete(req.sseId!);

					if (userId) {
						const room = getRoom(namespace.users, userId);
						room.leave(sseSocket as any);
					}
				});
			} catch (err) {
				if (wss.opts.logs)
					console.warn("[sse auth] Error during authentication:", err);
				sseManager.disconnect(req.sseId!);
			}
		}),
	);

	router.post("/sse/*", async (req, res) => {
		try {
			const pathname = req.path.replace("/sse", "");
			const namespace = wss.namespaces.get(pathname);

			if (!namespace) {
				res.status(404).json({
					err: true,
					msg: "Namespace not found",
				});
				return;
			}

			const sseId = req.query.sseId as string;
			const sseSocket = namespace._sseClients.get(sseId);

			if (!sseSocket) {
				res.status(404).json({
					err: true,
					msg: "SSE client not found",
				});
				return;
			}

			const { evt, data } = req.body;
			if (!isValidEventName(evt)) {
				res.status(400).json({
					err: true,
					msg: "Invalid event provided",
				});
				return;
			}

			sseSocket.handlers.emit(
				evt,
				...(data === undefined
					? []
					: Array.isArray(data)
						? data
						: [
								data,
							]),
			);
			res.json({
				err: false,
			});
		} catch (err) {
			if (wss.opts.logs) console.warn("[sse] Error handling POST:", err);
			res.status(500).json({
				err: true,
				msg: "Internal server error",
			});
		}
	});

	return router;
}
