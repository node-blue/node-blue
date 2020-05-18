import { EventEmitter } from "events";
import WebSocket, { MessageEvent } from "isomorphic-ws";

interface Options {
    host: string;
    path: string;
    port: number;
    protocol: "ws" | "wss";
    token: string;
    ws: (options: Options) => WebSocket;
}

const defaultOptions = {
    host: "hassio.local",
    path: "/api/websocket",
    port: 8123,
    protocol: "ws",
    token: "",
    ws: (options: Options) =>
        new WebSocket(
            `${options.protocol}://${options.host}:${options.port}${options.path}`
        ),
};

export const connect = async (callerOptions: Partial<Options> = {}) => {
    // @ts-ignore
    const options: Options = { ...defaultOptions, ...callerOptions };
    const emitter = new EventEmitter();
    const ws = options.ws(options);

    return connectAndAuthorize(emitter, ws, options.token);
};

const connectAndAuthorize = async (
    emitter: EventEmitter,
    ws: WebSocket,
    token: string
) => {
    ws.onmessage = messageHandler(emitter);
    ws.onerror = errorHandler;

    emitter.on("auth_ok", () => {
        console.log("auth ok!");
    });
    emitter.on("auth_invalid", errorHandler);
    emitter.on("auth_required", authHandler(ws, token));
};

const authHandler = (ws: WebSocket, token: string) => () => {
    if (!token || token === "") {
        throw new Error(
            "Home Assistant requires authentication, but no token was provided."
        );
    }

    const message = {
        type: "auth",
        access_token: token,
    };

    ws.send(JSON.stringify(message));
};

const errorHandler = (error: any) => {
    throw new Error(error.message);
};

const messageHandler = (emitter: EventEmitter) => (wsMessage: MessageEvent) => {
    const message = JSON.parse(wsMessage.data.toString());

    if (message.type) emitter.emit(message.type, message);

    if (message.type === "event" && message.event.event_type)
        emitter.emit(message.event.event_type, message.event);
};
