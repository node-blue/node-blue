import { EventEmitter } from "events";
import WebSocket, { MessageEvent } from "isomorphic-ws";

import { collection } from "../util/collection";

export interface HomeAssistantClient {
    addEventListener: (
        eventName: string,
        callback: HomeAssistantEventCallback
    ) => Promise<EventEmitter>;
    callService: (
        domain: string,
        service: string,
        additionalArguments?: { [key: string]: any }
    ) => Promise<null>;
    getStates: () => Promise<HomeAssistantEntity[]>;
    removeEventListener: (eventName: string) => Promise<void>;
    sendCommand: <T>(commandArgs?: object) => Promise<T>;
}
export type HomeAssistantEventCallback = (...args: any[]) => void;
export type HomeAssistantEntity = {
    entity_id: string;
    state: string;
    last_changed: string;
    last_updated: string;
    attributes: {
        friendly_name?: string;
        unit_of_measurement?: string;
        icon?: string;
        entity_picture?: string;
        supported_features?: number;
        hidden?: boolean;
        assumed_state?: boolean;
        device_class?: string;
        [key: string]: any;
    };
    context: {
        id: string;
        user_id: string | null;
    };
};
export type HomeAssistantMessageBase = {
    id?: number;
    type: string;
    [key: string]: any;
};
export type HomeAssistantResultMessage<T> = HomeAssistantMessageBase & {
    type: "result";
    success: boolean;
    result?: T | null;
    error?: {
        code: 1 | 2 | 3;
        message: string;
    };
};
export type HomeAssistantResultHandler<T> = (
    result: HomeAssistantResultMessage<T>
) => void;
export type HomeAssistantEvent = HomeAssistantMessageBase & {
    type: "event";
    event: {
        data: object;
        event_type: string;
        time_fired: string;
        origin: string;
        [key: string]: any;
    };
};
export type StateChangedEvent = HomeAssistantEvent & {
    event: {
        data: {
            entity_id: string;
            old_state: HomeAssistantEntity | null;
            new_state: HomeAssistantEntity | null;
        };
        event_type: "state_changed";
    };
};

interface Options {
    host: string;
    path: string;
    port: number;
    protocol: "ws" | "wss";
    token: string;
}

let messageId = 1;
const defaultOptions = {
    host: "hassio.local",
    path: "/api/websocket",
    port: 8123,
    protocol: "ws",
    token: "",
};
const pending = collection<HomeAssistantResultHandler<any>>({});
const subscriptions = collection<HomeAssistantResultMessage<null>>({});

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

const getClient = (
    emitter: EventEmitter,
    ws: WebSocket
): HomeAssistantClient => {
    const addEventListener = async (
        eventName: string,
        callback: HomeAssistantEventCallback
    ) => {
        try {
            const subscription = await sendCommand(ws)<null>({
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
        sendCommand(ws)<null>({
            type: "call_service",
            domain,
            service,
            service_data: additionalArguments,
        });

    const getStates = () =>
        sendCommand(ws)<HomeAssistantEntity[]>({
            type: "get_states",
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
        getStates,
        removeEventListener,
        sendCommand: sendCommand(ws),
    };
};

const messageHandler = (emitter: EventEmitter) => (wsMessage: MessageEvent) => {
    const message:
        | HomeAssistantResultMessage<unknown>
        | HomeAssistantEvent = JSON.parse(wsMessage.data.toString());

    // Emit an event for any message of any type:
    if (message.type) emitter.emit(message.type, message);

    // Emit an event for event-type messages:
    if (message.type === "event" && message.event.event_type)
        emitter.emit(message.event.event_type, message.event);

    // If this is a result message, handle it using the stored
    // handler:
    if (message.id && message.type === "result") {
        try {
            pending.findById(message.id.toString())(message);
        } catch (error) {
            // No handler exists, fail silently
        }
    }
};

const sendCommand = (ws: WebSocket) => <T>(commandArgs: object = {}) =>
    new Promise<T>((resolve, reject) => {
        const resultHandler: HomeAssistantResultHandler<T> = (
            result: HomeAssistantResultMessage<T>
        ) => {
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
        const ws = new WebSocket(
            `${options.protocol}://${options.host}:${options.port}${options.path}`
        );

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
