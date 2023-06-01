module.exports = {
  swSrc: "public/service-worker.js",
  swDest: "public/sw.js",
  globDirectory: "public/",
  globPatterns: ["**/*.{zkey,wasm}"],
  maximumFileSizeToCacheInBytes: 10000000,
};
