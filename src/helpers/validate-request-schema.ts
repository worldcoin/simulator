import type { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { errorResponse } from "./error-response";

/**
 * Validate a request body against a yup schema and returns an error if applicable
 */
export const validateRequestSchema = async <T extends yup.Schema>({
  schema,
  value,
}: {
  schema: T;
  value: unknown;
}): Promise<
  | {
      isValid: false;
      parsedParams?: never;
      handleError: (req: NextApiRequest, res: NextApiResponse) => void;
      errorMessage: string;
    }
  | {
      isValid: true;
      parsedParams: yup.InferType<T>;
      handleError?: never;
      errorMessage?: never;
    }
> => {
  let parsedParams: yup.InferType<typeof schema>;

  try {
    parsedParams = await schema.validate(value);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const handleError = (req: NextApiRequest, res: NextApiResponse) => {
        const validationError = error as yup.ValidationError;

        return errorResponse({
          code: "invalid",
          detail: validationError.message,
          attribute: validationError.path ?? null,
          statusCode: 400,
          res,
          req,
        });
      };

      return { isValid: false, handleError, errorMessage: error.message };
    }

    const genericError = "Something went wrong. Please try again.";

    const handleError = (req: NextApiRequest, res: NextApiResponse) => {
      errorResponse({
        res,
        statusCode: 500,
        code: "server_error",
        detail: genericError,
        attribute: null,
        req,
      });
    };

    return { isValid: false, handleError, errorMessage: genericError };
  }

  return { isValid: true, parsedParams };
};
