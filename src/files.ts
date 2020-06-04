export const onFileAdded = (path: string) => {
    // Import the file:
    require(path);

    // Remove from require's cache, so we can pick up changes:
    delete require.cache[path];
};

export const onFileChanged = (path: string) => {
    console.log(`Detected a change in ${path}`);
    console.log(`Node-BLUE needs to restart in order to pick up this change`);
    console.log(`Exiting...`);
    process.exit(0);
};

export const onFileUnlinked = (path: string) => {
    console.log(`Detected the deletion of ${path}`);
    console.log(`Node-BLUE needs to restart in order to pick up this change`);
    console.log(`Exiting...`);
    process.exit(0);
};
