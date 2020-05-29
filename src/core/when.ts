import { NodeBuilder } from "./builder";
import { RuleHandler } from "./rule";

export const when = (initializer?: string | RuleHandler) =>
    new NodeBuilder(initializer);
