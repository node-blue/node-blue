import { watch } from "chokidar";
import fetch from "node-fetch";
import ora from "ora";
import { join } from "path";

import "should";

import { onFileAdded, onFileChanged, onFileUnlinked } from "./files";
import { connect, ConnectOptions } from "./homeassistant";
import { node, Node } from "./node";
import { either, Either } from "./either";

declare global {
    var node: Node;
    var either: Either;
}

export const init = async (
    nodes: string = "nodes",
    options: ConnectOptions = {}
) => {
    const folderToWatch = join(process.cwd(), nodes);

    console.log(`Loading nodes from: ${folderToWatch}`);
    console.log("");
    console.log("Newly added files will be picked up automatically");
    console.log("Changed or removed files will trigger a restart");
    console.log("");

    const homeAssistantSpinner = ora("Connecting to Home Assistant");

    try {
        // Connect to Home Assistant:
        homeAssistantSpinner.start();
        const [{ emitter }, toolkit] = await connect(options);

        // Connected to Home Assistant:
        homeAssistantSpinner.succeed("Connected to Home Assistant");

        // Set global variables:
        // @ts-ignore
        globalThis.fetch = fetch;
        globalThis.node = node(emitter, toolkit);
        globalThis.either = either;

        // Set up listeners for file changes:
        const watcher = watch(folderToWatch);
        watcher.on("add", onFileAdded);
        watcher.on("change", onFileChanged);
        watcher.on("unlink", onFileUnlinked);
    } catch (error) {
        homeAssistantSpinner.fail(
            `Failed to connect to Home Assistant: ${error.message.toLowerCase()}`
        );
    }
};
