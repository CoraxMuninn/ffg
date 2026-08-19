import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored, version-pinned Decap CMS runtime (see SEC-M1). Third-party
    // minified build output: never edited by hand, and its integrity is
    // enforced by `npm run verify:decap`, not by lint.
    "public/admin/vendor/**",
    "public/admin/blog-quality.js",
  ]),
]);

export default eslintConfig;
