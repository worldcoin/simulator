module.exports = {
  globDirectory: "public/",
  globPatterns: ["**/*.{zkey,wasm}"],
  swDest: "public/sw.js",
  maximumFileSizeToCacheInBytes: 10000000,
};
