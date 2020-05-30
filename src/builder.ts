import { debounce, every, keys, map, set } from "lodash";

import { StateChangedEvent } from "./homeassistant";
import {
    EntityRule,
    EqualsRule,
    FieldChangedRule,
    Rule,
    RuleHandler,
    EmptyRule,
} from "./rule";

export type NodeCallback = (event: StateChangedEvent) => Promise<void>;

type RuleSet = {
    [hash: string]: RuleHandler;
};

export type StateChangedEventHandler = (
    event: StateChangedEvent
) => Promise<void>;

const ERR_NO_FURTHER_RULES = `No further rules are allowed. You passed a function into \`when\`, which means any logic determining whether or not to handle the event should be handled there.`;

export class NodeBuilder {
    private callRules: RuleSet = {};
    private cancelRules: RuleSet = {};
    private nextFields: string[] = ["changes", "turns"];
    private timeout: number = 0;

    constructor(initalizer?: string | RuleHandler) {
        if (typeof initalizer === "string") {
            const entityRule = new EntityRule(initalizer);
            set(this.callRules, entityRule.hash, entityRule.test);
            set(this.cancelRules, entityRule.hash, entityRule.test);
        } else if (typeof initalizer === "function") {
            const rule = new Rule(initalizer);
            set(this.callRules, rule.hash, rule.test);
            this.nextFields = [];
        } else {
            const emptyRule = new EmptyRule();
            set(this.callRules, emptyRule.hash, emptyRule.test);
            this.nextFields = [];
        }
    }

    changes = (path?: string) => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.nextFields.includes("changes")) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // If no path is specified, we don't need to add
        // any additional rules:
        if (!path) return this;

        // If a path is specified, we add a rule:
        const rule = new FieldChangedRule(path);
        set(this.callRules, rule.hash, rule.test);

        // Set the next possible calls (`do` can always be called):
        this.nextFields = ["from", "to", "for"];

        return this;
    };

    // Add a rule that checks whether the old state equals
    // the provided value:
    from = (value: string, path: string = "state") => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.nextFields.includes("from")) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // First, define a rule that checks whether the specified
        // path has changed at all:
        const changedRule = new FieldChangedRule(path);
        set(this.callRules, changedRule.hash, changedRule.test);

        // Then, define a rule that checks whether the old value
        // was the specified value:
        const fromRule = new EqualsRule(`old_state.${path}`, value);
        set(this.callRules, fromRule.hash, fromRule.test);

        // Finally, if we move back to the value that we wanted to move
        // away from, we need to cancel the callback:
        const toRule = new EqualsRule(`new_state.${path}`, value);
        set(this.cancelRules, toRule.hash, toRule.test);

        // Set the next possible calls (`do` can always be called):
        this.nextFields = ["to", "for"];

        return this;
    };

    // Add a rule that checks whether the new state equals
    // the provided value:
    to = (value: string, path: string = "state") => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.nextFields.includes("to")) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // First, define a rule that checks whether the specified
        // path has changed at all:
        const changedRule = new FieldChangedRule(path);
        set(this.callRules, changedRule.hash, changedRule.test);

        // Then, define a rule that checks whether the new value
        // was the specified value:
        const toRule = new EqualsRule(`new_state.${path}`, value);
        set(this.callRules, toRule.hash, toRule.test);

        // Finally, if we move away from the value that we wanted to move
        // to, we need to cancel the callback:
        const fromRule = new EqualsRule(`old_state.${path}`, value);
        set(this.cancelRules, fromRule.hash, fromRule.test);

        // Set the next possible calls (`do` can always be called):
        this.nextFields = ["from", "for"];

        return this;
    };

    // Alias for `changes.to`:
    turns = (state: string) => {
        return this.changes("state").to(state);
    };

    // Wrappers around `turns`, aliases for `changes.to`:
    becomes = this.turns;
    switches = this.turns;

    // Add a duration during which all rules should evaluate to
    // true:
    for = (
        value: number,
        unit?: "milliseconds" | "seconds" | "minutes" | "hours"
    ) => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.nextFields.includes("for")) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // Set the correct timeout based on the passed in unit,
        // and default to milliseconds:
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

        // Set the next possible calls (`do` can always be called):
        this.nextFields = [];

        return this;
    };

    or = () => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.nextFields.includes("or")) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // TODO: Implement.
        // TODO: Set the next possible calls (`do` can always be called)

        return this;
    };

    when = (entity_id: string) => {
        // If we don't allow new rules, this shouldn't be called,
        // so throw an error if it is:
        if (!this.nextFields.includes("when")) {
            console.warn(ERR_NO_FURTHER_RULES);
            return this;
        }

        // TODO: Implement.
        // TODO: Set the next possible calls (`do` can always be called)

        return this;
    };

    do = (callback: NodeCallback): StateChangedEventHandler => {
        const debouncedCallback = debounce(callback, this.timeout);

        return async (event) => {
            const isTrue = (res: boolean) => res === true;
            const testRule = (ruleHandler: RuleHandler) => ruleHandler(event);

            // Always evaluate all the call rules:
            const allCallRulesEvaluateToTrue = every(
                await Promise.all(map(this.callRules, testRule)),
                isTrue
            );

            // Only evaluate the cancel rules if the timeout is set.
            // Only evaluate the cancel rules if there is more than one,
            // because that would be the entity rule. Only checking that rule
            // would often result in both the cancel and call rules evaluating
            // to true, which shouldn't happen.
            const allCancelRulesEvaluateToTrue =
                this.timeout > 0 &&
                keys(this.cancelRules).length > 1 &&
                every(
                    await Promise.all(map(this.cancelRules, testRule)),
                    isTrue
                );

            // Throw if the callback should both be called and cancelled:
            if (allCallRulesEvaluateToTrue && allCancelRulesEvaluateToTrue) {
                throw new Error(
                    "Callback should be called and cancelled at the same time!"
                );
            }

            // Cancel the callback if either condition is true:
            if (allCallRulesEvaluateToTrue || allCancelRulesEvaluateToTrue) {
                debouncedCallback.cancel();
            }

            // Call the debounced callback:
            if (allCallRulesEvaluateToTrue) {
                debouncedCallback(event);
            }
        };
    };
}
