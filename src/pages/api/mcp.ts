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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const hostnames = [
    "simulator.worldcoin.org",
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ].filter((hostname): hostname is string => Boolean(hostname));
  if (process.env.NODE_ENV !== "production")
    hostnames.push("localhost", "127.0.0.1", "[::1]");
  const validHost = hostHeaderValidation(hostnames);
  const validOrigin = originValidation(hostnames);
  if (!validHost(req, res) || !validOrigin(req, res)) return;
  await handle(req, res, req.body as unknown);
}
