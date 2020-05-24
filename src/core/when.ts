import { Builder } from "./builder";
import { Rule, RuleHandler, EmptyRule, EqualsRule } from "./rule";

export type When = (initializer?: RuleHandler | string) => Builder;

export const when: When = (initializer) => {
    if (initializer === undefined || initializer === null) {
        // We are going to respond to all state changes, and no further rules
        // are allowed:
        return new Builder([new EmptyRule()]);
    }

    if (typeof initializer === "string") {
        if (initializer.split(".").length !== 2)
            throw new Error("Provided argument is not a valid `entity_id`!");

        // We are going to respond to state changes for a specific entity,
        // and allow further specification of other rules:
        return new Builder([new EqualsRule("entity_id", initializer)]);
    }

    // The user has provided his own way of evaluating rules, so we
    // add it as a rule, and allow for no further adding of rules:
    return new Builder([new Rule(initializer)], false);
};
