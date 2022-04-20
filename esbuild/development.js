import esbuild from "esbuild";
import { once } from "node:events";
import { copyFileSync, watch } from "node:fs";
import { createServer, request } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opener from "opener";
import config from "./config.js";

/** @type {import('http').ServerResponse[]} */
const clients = [];
setInterval(() => {
  // pinging clients
  for (const response of clients)
    response.write(`event: ping\ndata: ${Date.now()}\n\n`);
}, 20000);
function triggerClientsReload() {
  for (const response of clients) response.end("data: update\n\n");
  clients.length = 0;
}

try {
  await esbuild.build({
    ...config,
    sourcemap: "both",
    logLevel: "error",
    banner: {
      js: `new EventSource("/esbuild").onmessage = () => location.reload();`,
    },
    watch: {
      onRebuild(error) {
        triggerClientsReload();
        if (error) {
          console.error(error);
        }
      },
    },
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}

// exit on changes to this file
watch(fileURLToPath(import.meta.url), (event, filename) => {
  console.warn(`\n⚠️  '${filename}' changed, exiting...`);
  process.exit(22);
});
// watch static assets changes
const assetsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/static",
);
watch(
  assetsDir,
  { recursive: process.platform === "darwin" || process.platform === "win32" },
  (event, filename) => {
    console.warn(`[watch] asset '${filename}' was changed, reloading...`);
    copyFileSync(
      path.resolve(assetsDir, filename),
      path.resolve(config.outdir, filename),
    );
    triggerClientsReload();
  },
);

const tailwindConfigPath = path.resolve(
  path.dirname("../"),
  "tailwind.config.cjs",
);

watch(
  tailwindConfigPath,
  { recursive: process.platform === "darwin" || process.platform === "win32" },
  (event, filename) => {
    console.warn(`[watch] asset '${filename}' was changed, reloading...`);
    triggerClientsReload();
  },
);

const server = createServer().listen(0);
await once(server, "listening");
const PORT = server.address().port;
const ESBUILD_PORT = PORT + 1;
await esbuild.serve(
  {
    servedir: config.outdir,
    port: ESBUILD_PORT,
    onRequest({ method, path, status, timeInMS }) {
      console.info(`%s %s: %d in %d ms`, method, path, status, timeInMS);
    },
  },
  {},
);
server.on("request", (serverRequest, serverResponse) => {
  const { url, method, headers } = serverRequest;

  if (serverRequest.url === "/esbuild") {
    return clients.push(
      serverResponse.writeHead(200, {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/event-stream",
      }),
    );
  }

  serverRequest.pipe(
    request(
      {
        headers,
        hostname: "0.0.0.0",
        method,
        path: /[^/]\.[^/]+$/.test(url) ? url : "/index.html",
        port: ESBUILD_PORT,
      },
      (proxyResponse) => {
        serverResponse.writeHead(proxyResponse.statusCode, {
          ...proxyResponse.headers,
          "Cache-Control": "no-cache",
        });
        proxyResponse.pipe(serverResponse, { end: true });
      },
    ),
    { end: true },
  );
});

console.info(`⚙️  Server started at: http://localhost:${PORT}\r\n`);

if (!clients.length) {
  opener(`http://localhost:${PORT}`);
}
