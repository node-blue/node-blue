import { NodeBuilder, NodeConditionChecker } from "./builder";

export const when = (initializer?: string | NodeConditionChecker) =>
    new NodeBuilder(initializer);
