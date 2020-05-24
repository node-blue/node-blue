import commonjs from "rollup-plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

import pkg from "./package.json";

export default {
    input: ["src/index.ts"],
    output: [
        {
            file: pkg.main,
            format: "cjs",
            exports: "named",
            sourcemap: true,
            banner: "#!/usr/bin/env node",
        },
        {
            file: pkg.module,
            format: "es",
            exports: "named",
            sourcemap: true,
            banner: "#!/usr/bin/env node",
        },
    ],
    external: [
        "bufferutil",
        "child_process",
        "chokidar",
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
        "tty",
        "utf-8-validate",
        "util",
        "url",
        "zlib",
    ],
    plugins: [
        resolve({
            include: "./node_modules/**",
        }),
        json(),
        commonjs({
            extensions: [".js", ".ts"],
            ignore: ["conditional-runtime-dependency"],
        }),
        typescript(),
    ],
};
