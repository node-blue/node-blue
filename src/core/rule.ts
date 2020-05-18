import { createHash } from "crypto";

export type RuleHandler = (event: any) => boolean;

export class Rule {
    private handler: RuleHandler;
    private hash: string;

    constructor(handler: RuleHandler) {
        this.handler = handler;
        this.hash = createHash("md5")
            .update(JSON.stringify(this))
            .digest("hex");
    }

    public test = this.handler;
}

export class EmptyRule extends Rule {
    constructor() {
        const handler: RuleHandler = () => true;

        super(handler);
    }
}

export class EntityRule extends Rule {
    constructor(entity_id: string) {
        const handler: RuleHandler = (event: any) => {
            return event.entity_id === entity_id;
        };

        super(handler);
    }
}

export class EqualsRule extends Rule {
    constructor(path: string, value: string) {
        const handler: RuleHandler = (event: any) => {
            const newValue = event.data.new_state[path];

            return newValue === value;
        };

        super(handler);
    }
}

export class FieldChangedRule extends Rule {
    constructor(path: string) {
        const handler: RuleHandler = (event: any) => {
            const oldValue = event.data.old_state[path];
            const newValue = event.data.old_state[path];

            return oldValue !== newValue;
        };

        super(handler);
    }
}

export class OperatorRule extends Rule {
    constructor(oldPath: string, operator: "==" | "!=", newPath: string) {
        const handler: RuleHandler = (event: any) => {
            const oldValue = event.data.old_state[oldPath];
            const newValue = event.data.new_state[newPath];

            switch (operator) {
                case "==":
                    return oldValue === newValue;
                case "!=":
                    return oldValue !== newValue;
            }
        };

        super(handler);
    }
}
