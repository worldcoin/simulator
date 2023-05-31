module.exports = {
  globDirectory: "lib/semaphore",
  globPatterns: ["**/*.{zkey,wasm}"],
  swDest: "public/sw.js",
  maximumFileSizeToCacheInBytes: 100000000,
};
