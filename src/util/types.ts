export type NodeBlueCallback = () => void;

export type NodeBlueCondition = () => boolean | string;

export type NodeBlueHandler = {
    hash: string;
    // TODO: Fix event typing
    handler: (event: any) => Promise<void>;
};
