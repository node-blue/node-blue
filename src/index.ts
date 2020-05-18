import when from "./core";

export default when();

// import NodeBlueHandlerBuilder from "./core/HandlerBuilder";
// import {
//     NodeBlueCondition,
//     NodeBlueEventHandlerInCollection,
// } from "./core/types";
// import { createClient } from "./hass";
// import { collection } from "./util/helpers";

// const { HASS_URL, HASS_TOKEN } = process.env;

// const eventHandlers = collection<NodeBlueEventHandlerInCollection>(
//     [],
//     "hash",
//     "eventHandlers"
// );

// const when = (condition: NodeBlueCondition) =>
//     new NodeBlueHandlerBuilder(condition, eventHandlers);

// const init = async () => {
//     const homeAssistant = await createClient({
//         host: HASS_URL,
//         token: HASS_TOKEN,
//     });

//     // TODO: Fix event typing
//     homeAssistant.onStateChanged((event: any) => {
//         // Handle the event in every available handler:
//         Promise.all(
//             eventHandlers.getAll().map(({ eventHandler }) => {
//                 // Cancel running timer:
//                 // @ts-ignore
//                 eventHandler.cancel();

//                 // Call event handler:
//                 eventHandler(event, homeAssistant);
//             })
//         );
//     });
// };

// init();

// export default when;
