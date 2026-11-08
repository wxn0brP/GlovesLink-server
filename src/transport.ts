import { Server_AckEvent, Server_DataEvent } from "./types";

const DELIMITER = process.env.GLOVES_LINK_DELIMITER || "\b";
const EVENT_NAME_RE = /^[A-Za-z0-9_.:-]{1,64}$/;
const RESERVED_EVENTS = new Set([
	"__proto__",
	"constructor",
	"prototype",
	"hasOwnProperty",
	"isPrototypeOf",
	"propertyIsEnumerable",
	"toLocaleString",
	"toString",
	"valueOf",
	"__defineGetter__",
	"__defineSetter__",
	"__lookupGetter__",
	"__lookupSetter__",
	"connect",
	"disconnect",
]);

export function isPlainObject(value: unknown): value is Record<string, any> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidEventName(evt: unknown): evt is string {
	return (
		typeof evt === "string" &&
		EVENT_NAME_RE.test(evt) &&
		!RESERVED_EVENTS.has(evt)
	);
}

export function normalizeAckIndexes(
	ackI: unknown,
	dataLength: number,
): number[] {
	if (!Array.isArray(ackI)) return [];
	return ackI.filter(
		index =>
			typeof index === "number" &&
			Number.isInteger(index) &&
			index >= 0 &&
			index < dataLength,
	);
}

export function parse(
	type: string,
	raw: string,
): Server_DataEvent | Server_AckEvent | null {
	if (type === "json") {
		try {
			const parsed = JSON.parse(raw);
			return isPlainObject(parsed)
				? (parsed as Server_DataEvent | Server_AckEvent)
				: null;
		} catch {
			return null;
		}
	}

	try {
		const [evt, ack, ackIdsString, ...contentString] = raw.split(DELIMITER);

		const contents = contentString.map(value => {
			try {
				return JSON.parse(value);
			} catch {
				return value;
			}
		});

		if (ack) {
			return {
				ack: Number(ack),
				data: contents,
			};
		}

		const ackIds = ackIdsString
			.split(",")
			.filter(Boolean)
			.map(Number)
			.filter(index => Number.isInteger(index) && index >= 0);

		return {
			evt,
			ackI: ackIds,
			data: contents,
		};
	} catch {
		return null;
	}
}

export function stringify(type: "json" | "bin", data: any) {
	if (type === "json") return JSON.stringify(data);
	return [
		data.evt ?? "",
		data.ack ?? "",
		(data.ackI || []).join(","),
		...data.data.map(JSON.stringify),
	].join(DELIMITER);
}
