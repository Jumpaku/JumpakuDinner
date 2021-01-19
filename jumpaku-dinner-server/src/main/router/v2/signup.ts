import express from "express";
import { AppError } from "../../lib/app/AppError";
import {
  CreateUserParams,
  CreateUserResult,
  Users,
} from "../../lib/app/users/Users";
import { AppDatabasePool } from "../../state";
import { ApiResponse, failureFromAppError } from "../../lib/rest/response";
import { decode } from "../../lib/common/decode";
import { Status } from "../../lib/rest/status";
import log4js from "log4js";

async function signup(
  request: unknown
): Promise<ApiResponse<CreateUserResult>> {
  const decoding = decode(request, CreateUserParams.asDecoder());
  if (decoding.isFailure())
    return {
      status: Status.BadRequest,
      body: failureFromAppError(
        AppError.by(
          decoding.error,
          "InvalidRequest",
          "Request body cannot be parsed as CreateUserResult."
        )
      ),
    };
  if (!AppDatabasePool.isConfigured())
    return {
      status: Status.InternalServerError,
      body: failureFromAppError(
        new AppError("ServerError", "Incomplete database configuration.")
      ),
    };
  const db = AppDatabasePool.get();
  const creation = await new Users(db).createUser(decoding.value);
  if (creation.isFailure())
    return {
      status: Status.BadRequest,
      body: failureFromAppError(creation.error),
    };
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
      ...creation.value,
    },
  };
}

export const signupRouter = () => {
  const router = express.Router();
  router.post("/", async (req, res, next) => {
    const l = log4js.getLogger();
    l.level = "all";
    l.info(
      JSON.stringify({
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        header: req.headers,
      })
    );
    return signup(req.body)
      .then((r) => {
        res.status(r.status).json(r.body);
      })
      .finally(next);
  });
  return router;
};
