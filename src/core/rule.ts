import { createHash } from "crypto";
import { get } from "lodash";

import { StateChangedEvent } from "./homeassistant";

export type RuleHandler = (
    event: StateChangedEvent
) => boolean | Promise<boolean>;

export class Rule {
    public hash: string;
    public test: RuleHandler;

    constructor(handler: RuleHandler) {
        this.test = handler;
        this.hash = this.computeHash();
    }

    private computeHash = () =>
        createHash("md5").update(JSON.stringify(this)).digest("hex");
}

export class EmptyRule extends Rule {
    constructor() {
        const handler: RuleHandler = () => true;

        super(handler);
    }
}

export class EqualsRule extends Rule {
    constructor(path: string, expected: string) {
        const handler: RuleHandler = (event) => {
            const actual = get(event, `data.${path}`);

            return actual === expected;
        };

        super(handler);
    }
}

export class EntityRule extends EqualsRule {
    constructor(entity_id: string) {
        super("entity_id", entity_id);
    }
}

export class FieldChangedRule extends Rule {
    constructor(path: string) {
        const handler: RuleHandler = (event) => {
            const oldValue = get(event, `data.old_state.${path}`);
            const newValue = get(event, `data.new_state.${path}`);

            return oldValue !== newValue;
        };

        super(handler);
    }
}
