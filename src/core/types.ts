export type NodeBlueCallback = () => void;

export type NodeBlueCondition = (event: any) => boolean;

export type NodeBlueEventHandler = (event: any) => void;

export type NodeBlueEventHandlerInCollection = {
    hash: string;
    // TODO: Fix event typing
    eventHandler: NodeBlueEventHandler;
};
