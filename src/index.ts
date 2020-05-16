import { createClient } from "./hass";
import { createServer } from "http";

class NodeBlue {
    triggers: Trigger[];

    constructor() {
        this.triggers = [];
        this.init();
    }

    addTrigger = (trigger: Trigger) => {
        this.triggers.push(trigger);
        console.log("added a trigger:", trigger);
    };

    init = async () => {
        // FIXME: Hardcoded token!
        // @ts-ignore
        const client = await createClient({
            host: "192.168.1.3",
            token:
                "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjMTMzNzE1MTJjM2U0Nzk2YTU3ZDM2OWQyNTg4YjAwNSIsImlhdCI6MTU4OTY1ODY0NiwiZXhwIjoxOTA1MDE4NjQ2fQ.bSwPisuSZHCIHBnJp6viOKy0ai2jNe4nL2Nc7hZG0Fc",
        });

        await client.onAnyEvent(console.log);
    };
}

const nodeBlue = new NodeBlue();

class Trigger {
    entity_id: string | null;
    fromState: string | null;
    toState: string | null;
    callback: Function | null;

    constructor(entity_id: string | null = null) {
        this.entity_id = entity_id;
        this.fromState = null;
        this.toState = null;
        this.callback = null;
    }

    changes = () => this;

    from = (fromState: string) => {
        this.fromState = fromState;
        return this;
    };

    to = (toState: string) => {
        this.toState = toState;
        return this;
    };

    do = (callback: Function) => {
        this.callback = callback;
        // TODO: Convert to function to evaluate on every state change in Hass
        nodeBlue.addTrigger(this);
    };
}

const when = (trigger: string | Function) => {
    if (typeof trigger === "string") {
        // User passed an entity_id, so enable trigger builder.
        return new Trigger(trigger);
    } else {
        // User passed a function, so evaluate whenever state changes in Hass
        // TODO: evaluate the trigger whenever state changes in Hass
        return new Trigger();
    }
};

// FIXME: Created a web server to keep the process up, something should be done about this
const server = createServer();
server.listen(8080, () => {
    console.log("running!");
});

export default when;
