import { EventEmitter } from "events";
import ora from "ora";

import { HomeAssistantToolkit, StateChangedEvent } from "./homeassistant";

type StateChangedEventData = StateChangedEvent["data"];

export type Node = (
    name: string,
    fn: (
        event: StateChangedEventData,
        toolkit: HomeAssistantToolkit
    ) => void | Promise<void>
) => void;

export const node = (
    emitter: EventEmitter,
    toolkit: HomeAssistantToolkit
): Node => (name, fn) => {
    // Construct an event handler that executes the user's `node`,
    // and catches any errors that may be thrown:
    const handler = async (event: StateChangedEvent) => {
        try {
            await fn(event.data, toolkit);
        } catch (e) {
            // If an error is thrown, check if it was an AssertionError,
            // and throw it again if it wasn't:
            if (e.assertion === undefined) {
                throw e;
            }
        }
    };

    // Start listening for Home Assistant events:
    emitter.on("state_changed", handler);

    // Log that the handler was added successfully:
    ora().succeed(`Imported node called "${name}"`);
};
