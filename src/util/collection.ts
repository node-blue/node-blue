export interface ICollection<T> {
    collection: { [key: string]: T };
    clear: () => void;
    findById: (toFind: string) => T | undefined;
    forEach: (callback: (item: T) => void) => void;
    getAll: () => { [key: string]: T };
    insert: (toInsert: T, id: string) => T;
    remove: (toRemove: string) => void;
    replace: (toReplace: string, newValue: T) => T;
}

export const collection = <T>(
    collection: ICollection<T>["collection"]
): ICollection<T> => {
    const throwIfExists = (toFind: string) => {
        if (collection[toFind] !== undefined)
            throw new Error("Object already exists!");
    };

    const throwIfNotExists = (toFind: string) => {
        if (collection[toFind] === undefined)
            throw new Error("Object does not exist!");
    };

    const clear = () => {
        for (const key in collection) {
            delete collection[key];
        }
    };

    const findById = (toFind: string) => {
        throwIfNotExists(toFind);
        return collection[toFind];
    };

    const forEach = (callback: (item: T) => void) => {
        Object.keys(collection).forEach((key: string) =>
            callback(collection[key])
        );
        return;
    };

    const getAll = () => collection;

    const insert = (toInsert: T, id: string) => {
        throwIfExists(id);
        collection[id] = toInsert;
        return toInsert;
    };

    const remove = (toRemove: string) => {
        throwIfNotExists(toRemove);
        delete collection[toRemove];
        return;
    };

    const replace = (toReplace: string, newValue: T) => {
        throwIfNotExists(toReplace);
        collection[toReplace] = newValue;
        return newValue;
    };

    return {
        collection,
        clear,
        findById,
        forEach,
        getAll,
        insert,
        remove,
        replace,
    };
};
