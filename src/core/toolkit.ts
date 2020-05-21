import { HomeAssistantClient, HomeAssistantEntity } from "./homeassistant";

export type HomeAssistantToolkit = {
    callService: HomeAssistantClient["callService"];
    entity: (entity_id: string) => Promise<HomeAssistantEntity | undefined>;
    states: HomeAssistantClient["getStates"];
};

export const createToolkit = (
    hass: HomeAssistantClient
): HomeAssistantToolkit => {
    const entity = async (entity_id: string) => {
        const states = await hass.getStates();
        return states.find((entity) => entity.entity_id === entity_id);
    };

    return {
        callService: hass.callService,
        entity,
        states: hass.getStates,
    };
};
