import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";

import pkg from "./package.json";

export default {
    input: ["src/index.ts"],
    output: [
        {
            file: pkg.main,
            format: "cjs",
        },
        {
            file: pkg.module,
            format: "es",
        },
    ],
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
        commonjs(),
        resolve(),
        typescript(),
        babel({
            exclude: "node_modules/**",
        }),
    ],
};
