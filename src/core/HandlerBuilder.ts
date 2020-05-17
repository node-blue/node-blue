import { createHash } from "crypto";

import { NodeBlueCallback, NodeBlueCondition } from "../core/types";
import { createHandler } from "../util/helpers";

export default class NodeBlueHandlerBuilder {
    private callback: NodeBlueCallback;
    private collection: any;
    private condition: NodeBlueCondition | undefined = undefined;
    private entityId: string | undefined = undefined;
    private fromState: string | undefined = undefined;
    private onlyStateChanges: boolean = false;
    private toState: string | undefined = undefined;

    constructor(argument: string | NodeBlueCondition | undefined, collection) {
        if (argument === undefined) {
            this.condition = () => false;
        } else if (typeof argument === "string") {
            this.entityId = argument;
        } else {
            this.condition = argument;
        }

        this.callback = () => {};
        this.collection = collection;
    }

    public changes = () => this;

    public state = () => {
        this.onlyStateChanges = true;
        return this;
    };

    public from = (fromState: string) => {
        this.fromState = fromState;
        return this;
    };

    public to = (toState: string) => {
        this.toState = toState;
        return this;
    };

    public do = (callback: NodeBlueCallback) => {
        this.callback = callback;
        this._convertToHandlerAndRegister();
    };

    private _convertToHandlerAndRegister = () => {
        const { callback } = this;

        // Use user-provided handler or build own:
        // TODO: Fix event typing
        const condition = this.condition || createHandler(this);

        // Generate a unique has based on the object's properties:
        const hash = createHash("md5")
            .update(JSON.stringify(this))
            .digest("hex");

        // Wrap the handler to be a promise:
        // TODO: Fix event typing
        const handler = async (event: any) => {
            if (condition(event) === true) {
                callback();
            }
        };

        // Save the handler:
        this.collection.insert({ hash, handler });
    };
}
