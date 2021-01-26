import express from "express";
import { AppDatabasePool } from "../../AppDatabasePool";
import { Accounts } from "../../lib/app/accounts/Accounts";
import { Status } from "../../lib/rest/status";
import { decodeRequestBody } from "../../lib/rest/decodeRequestBody";
import { ApiError } from "../../lib/rest/ApiError";
import { decodeAuthHeader } from "../../lib/rest/decodeAuthHeader";
import {
  ApiRequest,
  ApiResponse,
  requestHandler,
} from "../../lib/rest/requestHandler";
import {
  CloseAccountParams,
  CloseAccountResult,
  CreateAccountParams,
  CreateAccountResult,
} from "../../lib/app/accounts/IAccounts";
import { AppModel } from "../../AppModel";

const signup = async ({
  body,
}: ApiRequest): Promise<ApiResponse<CreateAccountResult>> => {
  const json = decodeRequestBody(body, CreateAccountParams.asDecoder());
  if (json.isFailure()) return json.error.response();
  const creation = await AppModel.accounts.create(json.value);
  if (creation.isFailure()) return ApiError.wrap(creation.error).response();
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
      ...creation.value,
    },
  };
};

const close = async ({
  auth,
  body,
}: ApiRequest): Promise<ApiResponse<CloseAccountResult>> => {
  const jwt = decodeAuthHeader(auth);
  if (jwt.isFailure()) return jwt.error.response();
  const json = decodeRequestBody(
    Object.assign(Object.assign(body, jwt), auth),
    CloseAccountParams.asDecoder()
  );
  if (json.isFailure()) return json.error.response();
  const closing = await AppModel.accounts.close(json.value);
  if (closing.isFailure()) return ApiError.wrap(closing.error).response();
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
    },
  };
};

export const accountsRouter = () => {
  const router = express.Router();
  router.post("/signup", requestHandler(signup));
  router.post("/close", requestHandler(close));
  return router;
};
