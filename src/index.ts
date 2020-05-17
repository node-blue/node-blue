import { config } from "dotenv";
import { createServer } from "http";

import { createClient } from "./hass";
import NodeBlueHandlerBuilder from "./core/HandlerBuilder";
import {
    NodeBlueCondition,
    NodeBlueEventHandlerInCollection,
} from "./core/types";
import { collection } from "./util/helpers";

config();

const { HASS_URL, HASS_TOKEN } = process.env;

const eventHandlers = collection<NodeBlueEventHandlerInCollection>(
    [],
    "hash",
    "eventHandlers"
);

const when = (condition: NodeBlueCondition) =>
    new NodeBlueHandlerBuilder(condition, eventHandlers);

const init = async () => {
    const homeAssistant = await createClient({
        host: HASS_URL,
        token: HASS_TOKEN,
    });

    // TODO: Fix event typing
    homeAssistant.onStateChanged((event: any) => {
        // Handle the event in every available handler:
        Promise.all(
            eventHandlers.getAll().map(({ eventHandler }) => {
                // Cancel running timer:
                // @ts-ignore
                eventHandler.cancel();

                // Call event handler:
                eventHandler(event);
            })
        );
    });
};

init();

// FIXME: Created a web server to keep the process up, something should be done about this
const server = createServer();
server.listen(8080, () => {
    console.log("running!");
});

export default when;
