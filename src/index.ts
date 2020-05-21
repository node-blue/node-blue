import { watch } from "chokidar";
import { program } from "commander";
import { config } from "dotenv";
import figlet from "figlet";
import standard from "figlet/importable-fonts/Standard";
import path from "path";

import { description, name, version } from "../package.json";
import { DebouncedHomeAssistantStateEventHandler } from "./core/builder";
import { createToolkit } from "./core/toolkit";
import { connect, StateChangedEvent } from "./core/homeassistant";
import { when } from "./core/when";

import { collection } from "./util/collection";

config();

program.version(version);
program.description(description);

// @ts-ignore ref: https://github.com/patorjk/figlet.js/issues/52
figlet.parseFont("Standard", standard);
console.log(figlet.textSync(name));

program.option(
    "-h, --host <home_assistant_host>",
    "specify your Home Assistant host"
);

program.option(
    "-t, --token <home_assistant_token>",
    "specify a long-lived access token for your Home Assitant instance"
);

program.option(
    "-p, --port <home_assistant_port>",
    "specify which port to use when connecting to Home Assistant",
    "8123"
);

program.option(
    "-s, --secure",
    "connect to Home Assistant using the `wss` protocol over `ws`"
);

program
    .command("start [nodes]")
    .description(`Start ${name}`)
    // @ts-ignore
    .action((nodes?: string = "nodes") => {
        console.log(`Starting ${name}...`);

        const { host, port, secure, token } = program;
        const protocol =
            secure === undefined && process.env.HASS_SECURE === undefined
                ? "ws"
                : "wss";

        console.log("Connecting to Home Assistant...");

        connect({
            host: host || process.env.HASS_HOST,
            port: port || process.env.HASS_PORT,
            protocol,
            token: token || process.env.HASS_TOKEN,
        })
            .then((hass) => {
                console.log("Connected to Home Assistant!");

                const handlers = collection<
                    DebouncedHomeAssistantStateEventHandler
                >({});
                const toolkit = createToolkit(hass);
                const watcher = watch(path.join(process.cwd(), nodes));

                watcher.on("add", async (path) => {
                    // FIXME: This only actually works upon first startup, adding
                    // files after having started the programme does not work
                    try {
                        const handler = (await import(path)).node(when);
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
                hass.addEventListener(
                    "state_changed",
                    (event: StateChangedEvent) => {
                        handlers.forEach((handler) => {
                            try {
                                handler.cancel();
                                handler(event, toolkit);
                            } catch (error) {
                                console.error(error);
                            }
                        });
                    }
                );
            })
            .catch((error) => {
                console.error(error);
            });
    });

program.parse(process.argv);

export { when };
