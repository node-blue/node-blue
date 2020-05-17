import { createHash } from "crypto";
import debounce from "lodash.debounce";

import {
    NodeBlueCallback,
    NodeBlueCondition,
    NodeBlueEventHandler,
    NodeBlueEventHandlerInCollection,
} from "../core/types";
import { createCondition, ICollection } from "../util/helpers";

type TimeoutUnit = "milliseconds" | "seconds" | "minutes" | "hours";

export default class NodeBlueHandlerBuilder {
    private callback: NodeBlueCallback;
    private collection: ICollection<NodeBlueEventHandlerInCollection>;
    private condition: NodeBlueCondition | undefined = undefined;
    private entityId: string | undefined = undefined;
    private fromState: string | undefined = undefined;
    private onlyStateChanges: boolean = false;
    private timeout: number = 0;
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

    public for = (timeout: number, unit: TimeoutUnit) => {
        switch (unit) {
            case "seconds":
                this.timeout = timeout * 1000;
                break;
            case "minutes":
                this.timeout = timeout * 1000 * 60;
                break;
            case "hours":
                this.timeout = timeout * 1000 * 60 * 60;
                break;
            case "milliseconds":
            default:
                this.timeout = timeout;
        }
        return this;
    };

    public do = (callback: NodeBlueCallback) => {
        this.callback = callback;
        this._convertToHandlerAndRegister();
    };

    private _convertToHandlerAndRegister = () => {
        const { callback, timeout } = this;

        // Use user-provided handler or build own:
        // TODO: Fix event typing
        const condition = this.condition || createCondition(this);

        // Generate a unique has based on the object's properties:
        const hash = createHash("md5")
            .update(JSON.stringify(this))
            .digest("hex");

        // Generate the event handler:
        // TODO: Fix event typing
        const eventHandler: NodeBlueEventHandler = (event: any) => {
            const evaluatesToTrue = condition(event) === true;
            if (evaluatesToTrue) {
                callback();
            }
        };

        const debounced = debounce(eventHandler, timeout);

        // Save the handler:
        this.collection.insert({ hash, eventHandler: debounced });
    };
}
