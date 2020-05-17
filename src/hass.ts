import EventEmitter from "events";
import WebSocket, { MessageEvent } from "isomorphic-ws";

import collection, { ICollection } from "./util/collection";

export type Callback = (...args: any[]) => void;

interface Client {
    seq: number;
    options: Options;
    resultMap: object;
    // subscriptions: ICollection<any>;
    subscriptions: object;
    emitter: EventEmitter.EventEmitter;
    ws: WebSocket;
}

// FIXME: fix typings
export interface HomeAssistantClient {
    rawClient: Client;
    getStates: () => Promise<unknown>;
    getServices: () => Promise<unknown>;
    getPanels: () => Promise<unknown>;
    getConfig: () => Promise<unknown>;
    onStateChanged: (
        callback: (...args: any[]) => void
    ) => Promise<EventEmitter.EventEmitter>;
    onAnyEvent: (
        callback: (...args: any[]) => void
    ) => Promise<EventEmitter.EventEmitter>;
    on: (
        eventName: string,
        callback: (...args: any[]) => void
    ) => Promise<EventEmitter.EventEmitter>;
    unsubscribeFromEvent: (eventName: string) => Promise<void>;
    callService: (
        domain: string,
        service: string,
        additionalArgs?: {
            [key: string]: any;
        }
    ) => Promise<unknown>;
}

// FIXME: This interface is useless as it is, fix or remove
interface Message {
    [key: string]: any;
}

interface Options {
    protocol: "ws";
    host: string;
    port: number;
    path: string;
    token: string;
    messageSerializer: (outgoingMessage: Message) => string;
    messageParser: (incomingMessage: MessageEvent) => any;
    ws: (options: Options) => WebSocket;
}

const defaultOptions: Options = {
    protocol: "ws",
    host: "hassio.local",
    port: 8123,
    path: "/api/websocket",
    token: "",

    messageSerializer: (outgoingMessage: object) =>
        JSON.stringify(outgoingMessage),
    messageParser: (incomingMessage) =>
        JSON.parse(incomingMessage.data.toString()),

    ws: (options: Options) =>
        new WebSocket(
            `${options.protocol}://${options.host}:${options.port}${options.path}`
        ),
};

const command = async (commandArgs: { [key: string]: any }, client: Client) => {
    return new Promise((resolve, reject) => {
        const id = client.seq;

        client.resultMap[id] = (resultMessage) => {
            if (resultMessage.success) resolve(resultMessage.result);
            else reject(new Error(resultMessage.error.message));

            // We won't need this callback again once we use it:
            delete client.resultMap[id];
        };

        client.ws.send(
            client.options.messageSerializer({
                ...commandArgs,
                id,
            })
        );

        // Increment the shared message id sequence:
        client.seq++;
    });
};

const messageHandler = (client: Client) => {
    return (wsMessage: MessageEvent) => {
        const message = client.options.messageParser(wsMessage);

        // Emit an event for any message of any type:
        if (message.type) client.emitter.emit(message.type, message);

        // Emit an event for event-type messages:
        if (message.type === "event" && message.event?.event_type) {
            client.emitter.emit(message.event.event_type, message.event);
        }

        // If this is a result message, match it with the results map on the client
        // and call the matching function:
        if (message.id && message.type === "result") {
            if (typeof client.resultMap[message.id] !== "undefined") {
                client.resultMap[message.id](message);
            }
        }
    };
};

const clientObject = (client: Client): HomeAssistantClient => {
    const rawClient = client;

    const getStates = async () => command({ type: "get_states" }, client);
    const getServices = async () => command({ type: "get_services" }, client);
    const getPanels = async () => command({ type: "get_panels" }, client);
    const getConfig = async () => command({ type: "get_config" }, client);

    const onStateChanged = async (callback: (...args: any[]) => void) =>
        on("state_changed", callback);

    const onAnyEvent = async (callback: (...args: any[]) => void) => {
        if (typeof client.subscriptions[-1] === "undefined") {
            const subscription = await command(
                { type: "subscribe_events" },
                client
            );
            client.subscriptions[-1] = subscription;
        }

        // We already have an emitter for 'event' which we use to split up
        // events for each event_type - we just hook into it here:
        return client.emitter.on("event", (message) => callback(message.event));
    };

    const on = async (
        eventName: string,
        callback: (...args: any[]) => void
    ) => {
        if (typeof client.subscriptions[eventName] === "undefined") {
            const subscription = await command(
                {
                    type: "subscribe_events",
                    event_type: eventName,
                },
                client
            );

            client.subscriptions[eventName] = subscription;
        }

        return client.emitter.on(eventName, callback);
    };

    const unsubscribeFromEvent = async (eventName: string) => {
        const subscription = client.subscriptions[eventName];

        if (typeof subscription !== "undefined") {
            await command(
                {
                    type: "unsubscribe_events",
                    subscription: subscription.id,
                },
                client
            );
            delete client.subscriptions[eventName];
        }
    };

    const callService = async (
        domain: string,
        service: string,
        additionalArgs: { [key: string]: any } = {}
    ) => {
        return command(
            {
                type: "call_service",
                domain,
                service,
                service_data: additionalArgs,
            },
            client
        );
    };

    return {
        rawClient,

        getStates,
        getServices,
        getPanels,
        getConfig,

        onStateChanged,
        onAnyEvent,
        on,
        unsubscribeFromEvent,

        callService,
    };
};

const connectAndAuthorize = async (client: Client) =>
    new Promise<HomeAssistantClient>((resolve, reject) => {
        client.ws.onmessage = messageHandler(client);
        client.ws.onerror = (err) => reject(err);

        client.emitter.on("auth_ok", () => resolve(clientObject(client))); // a client object based on client
        client.emitter.on("auth_invalid", (msg) =>
            reject(new Error(msg.message))
        );
        client.emitter.on("auth_required", () => {
            // If auth is required, immediately reject the promise if no token was provided:
            if (client.options.token === "") {
                reject(
                    new Error(
                        "Home Assistant requires authentication, but no token was provided"
                    )
                );
            }

            const authMessage = {
                type: "auth",
                access_token: client.options.token,
            };

            client.ws.send(JSON.stringify(authMessage));
        });
    });

export const createClient = (callerOptions: Partial<Options> = {}) => {
    const options: Options = { ...defaultOptions, ...callerOptions };

    // TODO: Add proper subscription type
    // const subscriptions = collection<any>([], "_id", "Subscriptions");

    const client: Client = {
        seq: 1,
        options,
        resultMap: {},
        subscriptions: {},
        emitter: new EventEmitter.EventEmitter(),
        ws: options.ws(options),
    };

    return connectAndAuthorize(client);
};
