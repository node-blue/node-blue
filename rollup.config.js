import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";

export default {
    input: ["dist/src/index.js"],
    output: {
        file: "dist/index.js",
        format: "cjs",
        strict: false,
        banner: "#!/usr/bin/env node",
    },
    external: [
        "bufferutil",
        "child_process",
        "crypto",
        "events",
        "fs",
        "fsevents",
        "http",
        "https",
        "net",
        "os",
        "path",
        "stream",
        "tls",
        "utf-8-validate",
        "util",
        "url",
        "zlib",
    ],
    plugins: [
        resolve(),
        json(),
        commonjs({
            include: "node_modules/**",
        }),
    ],
};
