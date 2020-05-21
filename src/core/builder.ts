import debounce from "lodash.debounce";

import { StateChangedEvent } from "./homeassistant";
import { Rule, EqualsRule, FieldChangedRule } from "./rule";
import { HomeAssistantToolkit } from "./toolkit";

const ERR_NO_FURTHER_RULES = (field: string) =>
    `Ignoring call of \`${field}\` as no further rules are allowed. Most likely, you passed a function into \`when\`, which means any logic determining whether or not to handle the event should be handled there.`;

type NodeCallback = (
    event: StateChangedEvent,
    toolkit: HomeAssistantToolkit
) => void;

export type HomeAssistantStateEventHandler = (
    event: StateChangedEvent,
    toolkit: HomeAssistantToolkit
) => void;

interface Cancelable {
    cancel(): void;
}

export type DebouncedHomeAssistantStateEventHandler = HomeAssistantStateEventHandler &
    Cancelable;

export class Builder {
    public and = this; // TODO: allow multiple chains

    private allowNewRules: boolean = true;
    private rules: Rule[] = [];
    private timeout: number = 0;

    constructor(rules?: Rule[], allowNewRules: boolean = true) {
        if (rules) this.rules = rules;
        this.allowNewRules = allowNewRules;
    }

    changes = (...paths: string[]) => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.allowNewRules) {
            console.warn(ERR_NO_FURTHER_RULES("changes"));
            return this;
        }

        // If no paths are specified, we don't need to add
        // any additional rules:
        if (paths.length === 0) return this;

        // If there are paths, we add a rule for each:
        paths.forEach((path) => {
            const rule = new FieldChangedRule(path);
            this.rules.push(rule);
        });

        return this;
    };

    // Add a rule that checks whether the old state equals
    // the provided value:
    from = (value: string, path: string = "state") => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.allowNewRules) {
            console.warn(ERR_NO_FURTHER_RULES("from"));
            return this;
        }

        // First, define a rule that checks whether the specified
        // path has changed at all:
        const changedRule = new FieldChangedRule(path);
        this.rules.push(changedRule);

        // Then, define a rule that checks whether the old value
        // was the specified value:
        const fromRule = new EqualsRule(`old_state.${path}`, value);
        this.rules.push(fromRule);

        return this;
    };

    // Add a rule that checks whether the new state equals
    // the provided value:
    to = (value: string, path: string = "state") => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.allowNewRules) {
            console.warn(ERR_NO_FURTHER_RULES("to"));
            return this;
        }

        // First, define a rule that checks whether the specified
        // path has changed at all:
        const changedRule = new FieldChangedRule(path);
        this.rules.push(changedRule);

        // Then, define a rule that checks whether the old value
        // was the specified value:
        const toRule = new EqualsRule(`new_state.${path}`, value);
        this.rules.push(toRule);

        return this;
    };

    // Add a duration during which all rules should evaluate to
    // true:
    for = (
        value: number,
        unit: "milliseconds" | "seconds" | "minutes" | "hours"
    ) => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.allowNewRules) {
            console.warn(ERR_NO_FURTHER_RULES("for"));
            return this;
        }

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

    do = (callback: NodeCallback): DebouncedHomeAssistantStateEventHandler =>
        debounce<HomeAssistantStateEventHandler>((event, toolkit) => {
            const allRulesEvaluateToTrue = this.rules.every(
                (rule) => rule.test(event) === true
            );

            if (allRulesEvaluateToTrue) {
                callback(event, toolkit);
            }
        }, this.timeout);
}
