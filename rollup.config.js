import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

import pkg from "./package.json";

export default {
    input: "src/index.ts",
    output: [
        {
            banner: "#!/usr/bin/env node",
            file: pkg.main,
            format: "cjs",
        },
    ],
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        "events",
        "path",
    ],
    plugins: [json(), typescript()],
};
