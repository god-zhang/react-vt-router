import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";

const external = ["react", "react-dom"];

export default [
    // JS bundles (ESM + CJS), minified
    {
        input: "src/lib/index.ts",
        external,
        output: [
            { file: "dist/index.js", format: "es", sourcemap: false },
            { file: "dist/index.cjs", format: "cjs", sourcemap: false, exports: "named" },
        ],
        plugins: [
            resolve({ extensions: [".mjs", ".js", ".jsx", ".json", ".ts", ".tsx"] }),
            commonjs(),
            typescript({ tsconfig: "./tsconfig.lib.json", declaration: false }),
            terser(),
        ],
    },
    // Type declarations
    {
        input: "src/lib/index.ts",
        external,
        output: [{ file: "dist/index.d.ts", format: "es" }],
        plugins: [dts()],
    },
];
