import { Server_AckEvent, Server_DataEvent } from "./types";

const DELIMITER = process.env.GLOVES_LINK_DELIMITER || "\b";

export function parse(
	type: string,
	raw: string,
): Server_DataEvent | Server_AckEvent {
	if (type === "json") {
		try {
			return JSON.parse(raw);
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

		const ackIds = ackIdsString.split(",").filter(Boolean).map(Number);

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
