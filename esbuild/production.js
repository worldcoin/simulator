import esbuild from "esbuild";
import config from "./config.js";

try {
  await esbuild.build({
    ...config,
    define: { ...config.define, "process.env.NODE_ENV": "'production'" },
    minify: true,
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
