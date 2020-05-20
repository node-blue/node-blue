import chokidar from "chokidar";
import { program } from "commander";
import { config } from "dotenv";
import path from "path";

import { description, name, version } from "../package.json";
import { HomeAssistantStateEventHandler } from "./core/builder";
import { createToolkit } from "./core/helpers";
import { connect, StateChangedEvent } from "./core/homeassistant";
import { when } from "./core/when";

import { collection } from "./util/collection";

config();
const { HASS_URL, HASS_TOKEN } = process.env;

program.version(version);
program.description(description);

program.option(
    "-n, --nodes <location>",
    `Specify where ${name} can find nodes`,
    "nodes"
);

program.parse(process.argv);

console.log("Connecting to Home Assistant...");

connect({ host: HASS_URL, token: HASS_TOKEN })
    .then((hass) => {
        console.log("Connected to Home Assistant!");

        const handlers = collection<HomeAssistantStateEventHandler>({});
        const toolkit = createToolkit(hass);
        const watcher = chokidar.watch(path.join(process.cwd(), program.nodes));

        watcher.on("add", (path) => {
            // FIXME: This only actually works upon first startup, adding
            // files after having started the programme does not work
            try {
                const handler = require(path)(when);
                handlers.insert(handler, path);
                console.log(`Added handler for ${path}`);
            } catch (error) {
                console.error(error);
            }
        });
        watcher.on("change", () => {
            // TODO: implement
            return;
        });
        watcher.on("unlink", () => {
            // TODO: implement
            return;
        });

        // On every state change in Home Assistant, call all
        // possible handlers. If all of their rules evaluate to
        // `true`, then their callback will be called
        hass.addEventListener("state_changed", (event: StateChangedEvent) => {
            handlers.forEach((handler) => {
                try {
                    handler(event, toolkit);
                } catch (error) {
                    console.error(error);
                }
            });
        });
    })
    .catch((error) => {
        console.error(error);
    });
