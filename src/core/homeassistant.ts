import { EventEmitter } from "events";
import WebSocket, { MessageEvent } from "isomorphic-ws";

import collection from "../util/collection";

export interface HomeAssistantClient {
    addEventListener: (
        eventName: string,
        callback: HomeAssistantEventCallback
    ) => Promise<EventEmitter>;
    callService: (
        domain: string,
        service: string,
        additionalArguments?: { [key: string]: any }
    ) => Promise<void>;
    removeEventListener: (eventName: string) => Promise<void>;
    sendCommand: (commandArgs?: object) => void;
}
export type HomeAssistantEventCallback = (...args: any[]) => void;
export type HomeAssistantStateEvent = any;
export type HomeAssistantStateEventHandler = (
    event: HomeAssistantStateEvent
) => void;

interface Options {
    host: string;
    path: string;
    port: number;
    protocol: "ws" | "wss";
    token: string;
    ws: (options: Options) => WebSocket;
}

let messageId = 1;
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
const pending = collection<any>({}); // TODO: Add typing
const subscriptions = collection<any>({}); // TODO: Add typing

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

const getClient = (emitter: EventEmitter, ws: WebSocket) => {
    const addEventListener = async (
        eventName: string,
        callback: HomeAssistantEventCallback
    ) => {
        try {
            const subscription = await sendCommand(ws)({
                type: "subscribe_events",
                event_type: eventName,
            });

            subscriptions.insert(subscription, eventName);
        } catch (error) {
            // Subscription already exists, fail silently
        }

        return emitter.on(eventName, callback);
    };

    const callService = (
        domain: string,
        service: string,
        additionalArguments: { [key: string]: any } = {}
    ) =>
        sendCommand(ws)({
            type: "call_service",
            domain,
            service,
            service_data: additionalArguments,
        });

    const removeEventListener = async (eventName: string) => {
        try {
            const subscription = subscriptions.findById(eventName);

            await sendCommand(ws)({
                type: "unsubscribe_events",
                subscription: subscription.id,
            });

            subscriptions.remove(eventName);
        } catch (error) {
            console.warn("Something went wrong removing the subscription");
        }
    };

    return {
        addEventListener,
        callService,
        removeEventListener,
        sendCommand: sendCommand(ws),
    };
};

const messageHandler = (emitter: EventEmitter) => (wsMessage: MessageEvent) => {
    const message = JSON.parse(wsMessage.data.toString());

    // Emit an event for any message of any type:
    if (message.type) emitter.emit(message.type, message);

    // Emit an event for event-type messages:
    if (message.type === "event" && message.event.event_type)
        emitter.emit(message.event.event_type, message.event);

    // If this is a result message, handle it using the stored
    // handler:
    if (message.id && message.type === "result") {
        try {
            pending.findById(message.id)(message);
        } catch (error) {
            // No handler exists, fail silently
        }
    }
};

const sendCommand = (ws: WebSocket) => (commandArgs: object = {}) =>
    new Promise<any>((resolve, reject) => {
        const resultHandler = (result: any) => {
            if (result.success) resolve(result.result);
            else reject(new Error(result.error.message));

            pending.remove(messageId.toString());
        };
        pending.insert(resultHandler, messageId.toString());

        ws.send(
            JSON.stringify({
                ...commandArgs,
                id: messageId,
            })
        );

        messageId++;
    });

export const connect = (callerOptions: Partial<Options> = {}) =>
    new Promise<HomeAssistantClient>((resolve, reject) => {
        // @ts-ignore
        const options: Options = {
            ...defaultOptions,
            ...callerOptions,
        };
        const emitter = new EventEmitter();
        const ws = options.ws(options);

        const errorHandler = (error: any) => reject(new Error(error.message));

        ws.onmessage = messageHandler(emitter);
        ws.onerror = errorHandler;

        emitter.on("auth_required", authHandler(ws, options.token));
        emitter.on("auth_invalid", errorHandler);
        emitter.on("auth_ok", () => {
            const client: HomeAssistantClient = getClient(emitter, ws);
            resolve(client);
        });
    });
