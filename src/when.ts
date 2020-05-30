import { NodeBuilder } from "./builder";
import { RuleHandler } from "./rule";

export type When = (initializer?: string | RuleHandler) => NodeBuilder;

export const when: When = (initializer?: string | RuleHandler) =>
    new NodeBuilder(initializer);
