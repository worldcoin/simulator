import {
  hostHeaderValidation,
  originValidation,
  toNodeHandler,
} from "@modelcontextprotocol/node";
import { simulatorMcp } from "@/services/mcp";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: { bodyParser: { sizeLimit: "8kb" } },
  maxDuration: 60,
};

const handle = toNodeHandler(simulatorMcp);
const hostnames = ["simulator.worldcoin.org"];
if (process.env.NODE_ENV !== "production")
  hostnames.push("localhost", "127.0.0.1", "[::1]");
const validHost = hostHeaderValidation(hostnames);
const validOrigin = originValidation(hostnames);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!validHost(req, res) || !validOrigin(req, res)) return;
  await handle(req, res, req.body as unknown);
}
