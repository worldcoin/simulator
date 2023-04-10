module.exports = {
  globDirectory: "dist/",
  globPatterns: ["**/*.{zkey,wasm}"],
  swDest: "dist/sw.js",
  maximumFileSizeToCacheInBytes: 100000000,
};
