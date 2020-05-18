import { Builder } from "./builder";
import { Rule, RuleHandler, EmptyRule, EntityRule } from "./rule";

export const when = (node?: RuleHandler | string) => {
    if (node === undefined || node === null) {
        // We are going to respond to all state changes, and no further rules
        // are allowed:
        return new Builder([new EmptyRule()], false);
    }

    if (typeof node === "string") {
        if (node.split(".").length !== 2)
            throw new Error("Provided `node` is not a valid `entity_id`!");

        // We are going to respond to state changes for a specific entity,
        // and allow further specification of other rules:
        return new Builder([new EntityRule("entity_id")]);
    }

    // The user has provided his own way of evaluating rules, so we
    // add it as a rule, and allow for no further adding of rules:
    return new Builder([new Rule(node)], false);
};
