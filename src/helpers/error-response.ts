import type { NextApiRequest, NextApiResponse } from "next";

export function errorResponse(params: {
  res: NextApiResponse;
  statusCode: number;
  code: string;
  detail?: string;
  attribute: string | null;
  req: NextApiRequest;
}): void {
  const { res, code, attribute, detail } = params;

  res.status(params.statusCode).json({
    code,
    detail: detail ?? "Something went wrong",
    attribute: attribute ?? null,
  });
}
