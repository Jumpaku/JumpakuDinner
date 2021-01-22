import express, { Request, Response } from "express";
import { AppDatabasePool } from "../../AppDatabasePool";
import {
  Accounts,
  CloseAccountParams,
  CloseAccountResult,
  CreateAccountParams,
  CreateAccountResult,
} from "../../lib/app/accounts/Accounts";
import { Status } from "../../lib/rest/status";
import { decodeRequestBody } from "../../lib/rest/decodeRequestBody";
import { ApiError } from "../../lib/rest/ApiError";
import { decodeAuthHeader } from "../../lib/rest/decodeAuthHeader";
import { ApiRequest, ApiResponse } from "../../lib/rest/requestHandler";

async function signup(
  body: unknown
): Promise<ApiResponse<CreateAccountResult>> {
  const json = decodeRequestBody(body, CreateAccountParams.asDecoder());
  if (json.isFailure()) return json.error.response();
  const creation = await new Accounts(AppDatabasePool.get()).create(json.value);
  if (creation.isFailure()) return ApiError.by(creation.error).response();
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
      ...creation.value,
    },
  };
}

async function close({
  auth,
  body,
}: ApiRequest): Promise<ApiResponse<CloseAccountResult>> {
  const jwt = decodeAuthHeader(auth);
  if (jwt.isFailure()) return jwt.error.response();
  const json = decodeRequestBody(
    Object.assign(Object.assign(body, jwt), auth),
    CloseAccountParams.asDecoder()
  );
  if (json.isFailure()) return json.error.response();
  const closing = await new Accounts(AppDatabasePool.get()).close(json.value);
  if (closing.isFailure()) return ApiError.by(closing.error).response();
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
    },
  };
}

export const accountsRouter = () => {
  const router = express.Router();
  router.post("/signup", signup);
  router.post("/close", close);
  return router;
};
