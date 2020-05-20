import { HomeAssistantClient, HomeAssistantEntity } from "./homeassistant";

export type HomeAssistantToolkit = {};

export const createToolkit = (
    hass: HomeAssistantClient
): HomeAssistantToolkit => ({
    entity: (entity_id: string): object => {
        console.log(hass);
        return { entity_id };
    },
});
