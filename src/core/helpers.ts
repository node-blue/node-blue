import { HomeAssistantClient } from "../hass";

// @ts-ignore
export const getHelpers = (hass: HomeAssistantClient) => ({
    entity: (entity_id: string): object => ({ entity_id }),
});
