export interface ICollection<T> {
    collection: { [key: string]: T };
    clear: () => void;
    findById: (toFind: string) => T | undefined;
    getAll: () => { [key: string]: T };
    insert: (toInsert: T, id: string) => T;
    remove: (toRemove: string) => void;
}

export default <T>(
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

    return {
        collection,
        clear,
        findById,
        getAll,
        insert,
        remove,
    };
};
