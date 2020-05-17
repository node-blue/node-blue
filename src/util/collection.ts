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
    // update: (toUpdate: Partial<T>) => void;
}

const collection = <T>(
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

    // const update = (toUpdate: Partial<T>) => {
    //     throwIfNotExists(toUpdate[idKey]);

    //     const index = findIndexById(toUpdate[idKey]);
    //     const original = findById(toUpdate[idKey]);
    //     collection.splice(index, 1, {
    //         ...original,
    //         ...toUpdate,
    //     });

    //     return toUpdate;
    // };

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

export default collection;
