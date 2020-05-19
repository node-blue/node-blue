import { config } from "dotenv";

import { connect } from "./homeassistant";
import { when } from "./when";

config();
const { HASS_URL, HASS_TOKEN } = process.env;

export default () => {
    connect({ host: HASS_URL, token: HASS_TOKEN }).then((hass) => {
        hass.addEventListener("state_changed", console.log);
    });

    return when;
};
