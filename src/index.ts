import { program } from "commander";
import figlet from "figlet";
// @ts-ignore ref: https://github.com/patorjk/figlet.js/issues/52
import standard from "figlet/importable-fonts/Standard";

import { description, version } from "../package.json";

import { init } from "./init";

const name = "Node-BLUE";

program.version(version);
program.description(description);

// @ts-ignore ref: https://github.com/patorjk/figlet.js/issues/52
figlet.parseFont("Standard", standard);
console.log(figlet.textSync(name));

console.log(`Version: ${version}`);

program
    .command("start [nodes]")
    .description(`start ${name}`)
    .option("-h, --host <host>", "your Home Assistant instance's host")
    .option("-p, --path <path>", "path to the Websocket API")
    .option("-s, --secure", "use a secure connection")
    .option("-t, --token <token>", "a long-lived access token")
    .action(init);

program.parse(process.argv);
