import {
    AllConditions,
    AnyConditions,
    ConditionProperties,
    Engine,
} from "json-rules-engine";
import { debounce } from "lodash";

import { HomeAssistantToolkit, StateChangedEvent } from "./homeassistant";

const ERR_NO_FURTHER_RULES = `No further rules are allowed. You passed a function into \`when\`, which means any logic determining whether or not to handle the event should be handled there.`;

export type StateChangedEventHandler = (
    event: StateChangedEvent,
    toolkit: HomeAssistantToolkit
) => void;

export type NodeConditionChecker = (
    event: StateChangedEvent,
    toolkit: HomeAssistantToolkit
) => boolean;

export type NodeCallback = (
    event: StateChangedEvent,
    toolkit: HomeAssistantToolkit
) => void;

export class NodeBuilder {
    private conditions: (
        | AllConditions
        | AnyConditions
        | ConditionProperties
    )[][] = [[]];
    private conditionIndex = 0;
    private conditionChecker?: NodeConditionChecker;
    private timeout: number = 0;

    constructor(initalizer?: string | NodeConditionChecker) {
        if (typeof initalizer === "string") {
            this.conditions[this.conditionIndex].push({
                fact: "data",
                operator: "equal",
                path: "entity_id",
                value: initalizer,
            });
        } else if (initalizer === undefined) {
            this.conditionChecker = () => true;
        } else {
            this.conditionChecker = initalizer;
        }
    }

    changes = (path?: string) => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (this.conditionChecker) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // If no path is specified, we don't need to add
        // any additional rules:
        if (!path) return this;

        // If a path is specified, we add a condition:
        this.conditions[this.conditionIndex].push({
            fact: "data",
            operator: "notEqual",
            path: `old_state.${path}`,
            value: {
                fact: "data",
                path: `new_state.${path}`,
            },
        });

        return this;
    };

    // Add a rule that checks whether the old state equals
    // the provided value:
    from = (value: string, path: string = "state") => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (this.conditionChecker) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // Add two conditions to our rule:
        this.conditions[this.conditionIndex].push({
            all: [
                // Check whether the field has actually changed:
                {
                    fact: "data",
                    operator: "notEqual",
                    path: `old_state.${path}`,
                    value: {
                        fact: "data",
                        path: `new_state.${path}`,
                    },
                },
                // Check whether the old value is equal to what was specified:
                {
                    fact: "data",
                    operator: "equal",
                    path: `old_state.${path}`,
                    value,
                },
            ],
        });

        return this;
    };

    // Add a rule that checks whether the new state equals
    // the provided value:
    to = (value: string, path: string = "state") => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (this.conditionChecker) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // Add two conditions to our rule:
        this.conditions[this.conditionIndex].push({
            all: [
                // Check whether the field has actually changed:
                {
                    fact: "data",
                    operator: "notEqual",
                    path: `old_state.${path}`,
                    value: {
                        fact: "data",
                        path: `new_state.${path}`,
                    },
                },
                // Check whether the new value is equal to what was specified:
                {
                    fact: "data",
                    operator: "equal",
                    path: `new_state.${path}`,
                    value,
                },
            ],
        });

        return this;
    };

    // Add a duration during which all rules should evaluate to
    // true:
    for = (
        value: number,
        unit?: "milliseconds" | "seconds" | "minutes" | "hours"
    ) => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (this.conditionChecker) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // FIXME: Figure out to way to implement this.
        console.warn(
            "`for` currently is unsupported. Any delay specified will be treaded as `0`."
        );

        switch (unit) {
            case "seconds":
                this.timeout = value * 1000;
                break;
            case "minutes":
                this.timeout = value * 1000 * 60;
                break;
            case "hours":
                this.timeout = value * 1000 * 60 * 60;
                break;
            case "milliseconds":
            default:
                this.timeout = value;
                break;
        }

        return this;
    };

    and = () => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (this.conditionChecker) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // We're going to keep adding conditions to the first set, because
        // all of these will have to match, so we can just return the builder:
        return this;
    };

    or = () => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (this.conditionChecker) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // We have to increment this.conditionalIndex, as we're starting a new set:
        this.conditionIndex++;
        // TODO: Figure out a way to force use of 'when' after this.
        return this;
    };

    when = (entity_id: string) => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (this.conditionChecker) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // TODO: Write `when` implementation here instead of in a separate file
        // TODO: Rename this to when, looks cooler
        // TODO: initialize here
        return this;
    };

    do = (callback: NodeCallback): StateChangedEventHandler => {
        const debouncedCallback = debounce(callback, this.timeout);
        const ruleEngine = new Engine([
            {
                conditions: {
                    any: this.conditions.map((conditionSet) => ({
                        all: conditionSet,
                    })),
                },
                event: {
                    type: "conditions-met",
                },
            },
        ]);

        return async (event, toolkit) => {
            const results = await ruleEngine.run(event);

            if (results.events.length > 0) {
                // All rules are true, cancel any previously active calls:
                debouncedCallback.cancel();

                // And call the debounced callback again:
                debouncedCallback(event, toolkit);
            }
        };
    };
}
