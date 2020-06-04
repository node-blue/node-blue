export type Either = (one: Function, two: Function) => void | Promise<void>;

export const either: Either = (one, two) => {
    let errors: Error[] = [];

    // Loop and call both function arguments:
    [one, two].forEach((fn) => {
        try {
            fn();
        } catch (e) {
            // Catch any errors and store them:
            errors.push(e);
        }
    });

    // If each of the functions threw an error, none of the conditions passed,
    // so throw the first error we encountered:
    if (errors.length === 2) throw errors[0];

    // If at least one of the functions did not throw, it means the conditions passed,
    // so we do nothing and let the script continue
};
