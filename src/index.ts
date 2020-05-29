import { program } from "commander";
import figlet from "figlet";
import standard from "figlet/importable-fonts/Standard";

import { description, version } from "../package.json";

import { init } from "./core/init";
import { when } from "./core/when";

const name = "Node-BLUE";

program.version(version);
program.description(description);

// @ts-ignore ref: https://github.com/patorjk/figlet.js/issues/52
figlet.parseFont("Standard", standard);
console.log(figlet.textSync(name));

program
    .command("start [nodes]")
    .description(`Start ${name}`)
    .option("-h, --host <host>", "your Home Assistant instance's host")
    .option("-P, --path <path>", "path to the Websocket API", "/api/websocket")
    .option("-p, --port <port>", "your Home Assistant instance's port", "8123")
    .option("-s, --secure", "use a secure connection")
    .option("-t, --token <token>", "a long-lived access token")
    .action(init);

program.parse(process.argv);

export { when };
