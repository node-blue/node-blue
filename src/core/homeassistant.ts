import { EventEmitter } from "events";
import WebSocket from "isomorphic-ws";
import { getDiff, rdiffResult } from "recursive-diff";

let messageId = 1;

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

export type HomeAssistantMessage = {
    id?: number;
    type: "auth_invalid" | "auth_ok" | "auth_required" | "event" | "result";
    [key: string]: any;
};

export type HomeAssistantResult<T = null> = HomeAssistantMessage & {
    id: number;
    type: "result";
    success: boolean;
    result?: T;
    error?: {
        code: 1 | 2 | 3;
        message: string;
    };
};

export type HomeAssistantEvent = HomeAssistantMessage & {
    type: "event";
    event: {
        data: object;
        event_type: string;
        time_fired: string;
        origin: string;
        [key: string]: any;
    };
};

export type StateChangedEvent = {
    data: {
        entity_id: string;
        old_state: HomeAssistantEntity | null;
        new_state: HomeAssistantEntity | null;
    };
    event_type: "state_changed";
};

export type HomeAssistantClient = {
    addEventListener: (
        event_type: string,
        callback: (event: HomeAssistantEvent) => void
    ) => EventEmitter;
    emitter: EventEmitter;
};
export type HomeAssistantToolkit = {
    diff: (event: StateChangedEvent) => rdiffResult[];
    entity: (entity_id: string) => Promise<HomeAssistantEntity>;
    states: () => Promise<HomeAssistantEntity[]>;
};

const createHomeAssistantClientAndToolkit = ({
    emitter,
    ws,
}: {
    emitter: EventEmitter;
    ws: { send: (data: any) => void };
}): [HomeAssistantClient, HomeAssistantToolkit] => {
    const once = <T = unknown>(event: string) =>
        new Promise<T>((resolve) =>
            emitter.once(event, (message: HomeAssistantResult) =>
                resolve(message.result)
            )
        );

    const addEventListener = (
        event_type: string,
        callback: (event: HomeAssistantEvent) => void
    ) => {
        // Only subscribe if user wants to listen to an even other than state changes:
        if (event_type !== "state_changed") {
            const id = messageId;
            ws.send({ id, type: "subscribe_events", event_type });
        }

        // Return a listener:
        return emitter.on(event_type, callback);
    };

    const states = async (): Promise<HomeAssistantEntity[]> => {
        const id = messageId;
        ws.send({ id, type: "get_states" });
        return once(`result_${id}`);
    };

    const entity = async (
        entity_id: string
    ): Promise<HomeAssistantEntity | undefined> => {
        const entities = await states();
        return entities.find((entity) => entity.entity_id === entity_id);
    };

    const diff = (event: StateChangedEvent) => {
        const oldState = event.data.old_state;
        const newState = event.data.new_state;

        return getDiff(oldState, newState, true);
    };

    const client: HomeAssistantClient = {
        addEventListener,
        emitter,
    };

    const toolkit: HomeAssistantToolkit = {
        diff,
        entity,
        states,
    };

    return [client, toolkit];
};

type WebSocketOptions = {
    host: string;
    path: string;
    port: number;
    protocol: "ws" | "wss";
    onError?: (event: WebSocket.ErrorEvent) => void;
    onMessage?: (
        event: HomeAssistantMessage | HomeAssistantResult | HomeAssistantEvent
    ) => void;
};

const createWebsocket = ({
    host,
    path,
    port,
    protocol,
    onError,
    onMessage,
}: WebSocketOptions) => {
    const ws = new WebSocket(`${protocol}://${host}:${port}${path}`);

    if (onError) ws.onerror = onError;
    if (onMessage)
        ws.onmessage = (message: WebSocket.MessageEvent) =>
            onMessage(JSON.parse(message.data.toString()));

    return {
        send: (data: { [key: string]: any }) => {
            ws.send(JSON.stringify(data));
            messageId++;
        },
    };
};

type ConnectOptions = {
    host: string;
    path: string;
    port: number;
    protocol: "ws" | "wss";
    token?: string;
};

const defaultOptions: ConnectOptions = {
    host: "hassio.local",
    path: "/api/websocket",
    port: 8123,
    protocol: "ws",
};

export const connect = async (
    callerOptions: Partial<ConnectOptions> = {}
): Promise<[HomeAssistantClient, HomeAssistantToolkit]> => {
    const emitter = new EventEmitter();
    const event = (event: string) =>
        new Promise((resolve) => emitter.once(event, resolve));

    // Combine provided options with defaults:
    const {
        host,
        path,
        port,
        protocol,
        token: access_token,
    }: ConnectOptions = {
        ...defaultOptions,
        ...callerOptions,
    };

    // Create a handler for WebSocket errors:
    const onError: WebSocketOptions["onError"] = (error) => {
        throw new Error(error.message);
    };

    // Create a handler for WebSocket messages:
    const onMessage: WebSocketOptions["onMessage"] = (message) => {
        // Emit all messages received, as long as they have a `type`:
        if (message.type) emitter.emit(message.type, message);

        // Also emit specific events under their `event_type`:
        if (message.type === "event") {
            const { event } = message as HomeAssistantEvent;
            const { event_type } = event;
            if (event_type) emitter.emit(event_type, event);
        }

        // Handle response messages by emitting a one-off event:
        if (message.type === "result") {
            const { id } = message as HomeAssistantResult;
            emitter.emit(`result_${id}`, message);
        }
    };

    // Create the WebSocket connection (this also starts the authentication flow):
    const ws = createWebsocket({
        host,
        path,
        port,
        protocol,
        onError,
        onMessage,
    });

    // Check if we need to log in:
    const authRequired =
        ((await Promise.race([
            event("auth_ok"),
            event("auth_required"),
        ])) as HomeAssistantMessage).type === "auth_required";

    if (authRequired === true) {
        // Home Assistant has concluded that we need to log in.

        // Throw if no token is provided:
        if (!access_token) {
            throw new Error("No access token provided");
        }

        // Throw if token is an empty string:
        if (access_token === "") {
            throw new Error("Access token cannnot be an empty string");
        }

        // A token has been provided, use it to authenticate with Home Assistant:
        ws.send({
            type: "auth",
            access_token,
        });

        // Check if we are successfully logged in:
        const authOk =
            ((await Promise.race([
                event("auth_ok"),
                event("auth_invalid"),
            ])) as HomeAssistantMessage).type === "auth_ok";

        if (authOk === false) {
            // We received a 'auth_invalid' response, handle it by throwing:
            throw new Error("Invalid access token or password");
        }
    }

    // Subscribe to state events:
    ws.send({
        event_type: "state_changed",
        id: messageId,
        type: "subscribe_events",
    });

    // Construct and return the Home Assistant client and toolkit objects:
    return createHomeAssistantClientAndToolkit({
        emitter,
        ws,
    });
};
