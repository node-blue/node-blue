import { config } from "dotenv";

import { when } from "./when";
import { connect } from "./homeassistant";

config();
const { HASS_URL, HASS_TOKEN } = process.env;

export default () => {
    connect({ host: HASS_URL, token: HASS_TOKEN }).then((hass) => {
        console.log(hass);
    });
    return when;
};
