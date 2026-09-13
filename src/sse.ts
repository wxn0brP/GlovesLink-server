import VEE from "@wxn0brp/event-emitter";
import { Namespace } from "./namespace";
import { Room } from "./room";
import { AuthFnResult, Server_Auth_Opts } from "./types";
import type { FFRequest, FFResponse } from "@wxn0brp/falcon-frame";

export class SSESocket<
	T = {
		_id?: string;
	},
> {
	public id: string;
	public user: T;
	public namespacePath: string;
	public namespace: Namespace;
	public rooms: Set<Room> = new Set();
	public logs = false;

	public handlers = new VEE();
	public authData: Server_Auth_Opts;
	public authResult: AuthFnResult;

	public volatile: {
		emit: (evt: string, ...args: any[]) => void;
		send: (evt: string, ...args: any[]) => void;
	};

	constructor(
		public req: FFRequest,
		public res: FFResponse,
		public server: any,
		id?: string,
	) {
		this.id =
			id ||
			Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
		this.user = {
			_id: this.id,
		} as T;

		this.volatile = {
			emit: (evt: string, ...args: any[]) => {
				this.emit(evt, ...args);
			},
			send: (evt: string, ...args: any[]) => {
				this.emit(evt, ...args);
			},
		};
	}

	emit(evt: string, ...args: any[]) {
		this.res.sseSend({
			evt,
			data: args,
		});
	}

	send(evt: string, ...args: any[]) {
		return this.emit(evt, ...args);
	}

	on(evt: string, handler: (...args: any[]) => void | any) {
		this.handlers.on(evt, handler);
	}

	disconnect() {
		this.res.end();
	}

	joinRoom(roomOrName: Room | string) {
		const room =
			typeof roomOrName === "string" ? this.room(roomOrName) : roomOrName;
		room.join(this as any);
	}

	leaveRoom(roomOrName: Room | string) {
		const room =
			typeof roomOrName === "string" ? this.room(roomOrName) : roomOrName;
		room.leave(this as any);
	}

	leaveAllRooms() {
		for (const room of this.rooms.values()) room.leave(this as any);
	}

	room(name: string) {
		return this.namespace.room(name);
	}

	userRoom() {
		return this.namespace.userRoom((this.user as any)?._id);
	}
}
