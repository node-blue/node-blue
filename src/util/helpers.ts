export interface ICollection<T> {
    $collection: {
        name: string;
    };
    clear: () => Array<T>;
    findById: (toFind: string) => T | undefined;
    findByIndex: (toFind: number) => T;
    findIndexById: (toFind: string) => number;
    getAll: () => Array<T>;
    insert: (toInsert: T) => T;
    insertAt: (toInsert: T, index: number) => T;
    remove: (toRemove: string) => void;
}

export const collection = <T>(
    collection: Array<T>,
    idKey: string = "_id",
    name: string = "Collection"
): ICollection<T> => {
    const throwIfExists = (toFind: string) => {
        if (findIndexById(toFind) > -1)
            throw new Error("Object already exists!");
    };

    const throwIfNotExists = (toFind: string) => {
        if (findIndexById(toFind) < 0)
            throw new Error("Object does not exist!");
    };

    const clear = () => collection.splice(0, collection.length);

    const findById = (toFind: string) =>
        collection.find((obj) => obj[idKey] === toFind);

    const findByIndex = (toFind: number) => collection[toFind];

    const findIndexById = (toFind: string) =>
        collection.findIndex((obj) => obj[idKey] === toFind);

    const getAll = () => collection;

    const insert = (toInsert: T, index?: number) => {
        throwIfExists(toInsert[idKey]);

        if (index) collection.splice(index, 1, toInsert);
        else collection.push(toInsert);

        return toInsert;
    };

    const insertAt = (toInsert: T, index: number) => insert(toInsert, index);

    const remove = (toRemove: string) => {
        throwIfNotExists(toRemove);

        const index = findIndexById(toRemove);
        collection.splice(index, 1);

        return;
    };

    return {
        $collection: {
            name,
        },
        clear,
        findById,
        findByIndex,
        findIndexById,
        getAll,
        insert,
        insertAt,
        remove,
        // update,
    };
};

// TODO: Fix event typing
// TODO: Fix triggerBuilder typing
export const createHandler = (triggerBuilder: any) => (event: any) => {
    const { data } = event;
    const { old_state, new_state } = data;

    // Check for entityId match, if set:
    if (triggerBuilder.entityId) {
        if (triggerBuilder.entityId !== data.entity_id) return false;
    }

    // Check if the state has changed at all:
    if (triggerBuilder.onlyStateChanges) {
        if (old_state.state === new_state.state) return false;
    }

    // Check for fromState match:
    if (triggerBuilder.fromState) {
        if (old_state.state !== triggerBuilder.fromState) return false;
    }

    // Check for toState match:
    if (triggerBuilder.toState) {
        if (new_state.state !== triggerBuilder.toState) return false;
    }

    // All checks passed!
    return true;
};
