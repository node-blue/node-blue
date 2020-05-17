import { config } from "dotenv";
import { createServer } from "http";

import { createClient } from "./hass";
import NodeBlueHandlerBuilder from "./core/HandlerBuilder";
import { NodeBlueCondition, NodeBlueHandler } from "./core/types";
import { collection } from "./util/helpers";

config();

const { HASS_URL, HASS_TOKEN } = process.env;

const handlers = collection<NodeBlueHandler>([], "hash", "handlers");

const when = (condition: NodeBlueCondition) =>
    new NodeBlueHandlerBuilder(condition, handlers);

const init = async () => {
    const homeAssistant = await createClient({
        host: HASS_URL,
        token: HASS_TOKEN,
    });

    // TODO: Fix event typing
    homeAssistant.onStateChanged((event: any) => {
        Promise.all(handlers.getAll().map(({ handler }) => handler(event)));
    });
};

init();

// FIXME: Created a web server to keep the process up, something should be done about this
const server = createServer();
server.listen(8080, () => {
    console.log("running!");
});

export default when;
