import { watch } from "chokidar";
import { join } from "path";

import { StateChangedEventHandler } from "./builder";
import { connect, ConnectOptions, HomeAssistantToolkit } from "./homeassistant";
import { when, When } from "./when";

type Node = (
    when: When,
    toolkit: HomeAssistantToolkit
) => StateChangedEventHandler;

export const init = async (
    nodes: string = "nodes",
    options: ConnectOptions = {}
) => {
    try {
        // Connect to Home Assistant:
        console.log("Connecting to Home Assistant...");
        const [{ emitter }, toolkit] = await connect(options);

        // Connected to Home Assistant:
        console.log("Connected to Home Assistant!");

        // Set up listeners for file changes:
        try {
            const watcher = watch(join(process.cwd(), nodes));
            const listeners: { [path: string]: StateChangedEventHandler } = {};

            // Handle a new node being added:
            watcher.on("add", async (path: string) => {
                // Import the file:
                const node: Node = require(path).node;
                const handler = node(when, toolkit);

                // Remove it from require's cache, allowing changes to be
                // picked up:
                delete require.cache[path];

                // Store a reference to the handler so it can be updated later:
                listeners[path] = handler;

                // Start listening:
                emitter.addListener("state_changed", handler);

                console.log(`Added a handler for ${path}`);
            });

            // Handle an existing node being changed:
            watcher.on("change", async (path: string) => {
                // Get a reference to the current listener so we can remove it:
                const currentHandler = listeners[path];

                // Stop listening using the current listener:
                emitter.removeListener("state_changed", currentHandler);

                // Import the file:
                const node: Node = require(path).node;
                const handler = node(when, toolkit);

                // Remove it from require's cache, allowing changes to be
                // picked up:
                delete require.cache[path];

                // Store a reference to the handler so it can be updated later:
                listeners[path] = handler;

                // Start listening:
                emitter.addListener("state_changed", handler);

                console.log(`Updated handler for ${path}`);
            });

            // Handle a node being removed:
            watcher.on("unlink", (path: string) => {
                // Get a reference to the current listener so we can remove it:
                const currentHandler = listeners[path];

                // Stop listening using the current listener:
                emitter.removeListener("state_changed", currentHandler);

                console.log(`Removed handler for ${path}`);
            });
        } catch (error) {
            console.error(
                `Encountered an error while setting up: ${error.message}`
            );
            console.log("Exiting...");
            process.exit(1);
        }
    } catch (error) {
        console.error(`Unable to connect to Home Assistant: ${error.message}`);
        console.log("Exiting...");
        process.exit(1);
    }
};
