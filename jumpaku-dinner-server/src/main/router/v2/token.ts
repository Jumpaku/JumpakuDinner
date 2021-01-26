import express from "express";
import { AppDatabasePool } from "../../AppDatabasePool";
import { AppModel } from "../../AppModel";
import { Accounts } from "../../lib/app/accounts/Accounts";
import {
  IssueTokenParams,
  IssueTokenResult,
  VerifyTokenParams,
  VerifyTokenResult,
} from "../../lib/app/accounts/IAccounts";
import { ApiError } from "../../lib/rest/ApiError";
import { decodeAuthHeader } from "../../lib/rest/decodeAuthHeader";
import { decodeRequestBody } from "../../lib/rest/decodeRequestBody";
import {
  ApiRequest,
  ApiResponse,
  requestHandler,
} from "../../lib/rest/requestHandler";
import { Status } from "../../lib/rest/status";

const sign = async ({
  body,
}: ApiRequest): Promise<ApiResponse<IssueTokenResult>> => {
  const json = decodeRequestBody(body, IssueTokenParams.asDecoder());
  if (json.isFailure()) return json.error.response();
  const result = await AppModel.accounts.issueToken(json.value);
  if (result.isFailure()) return ApiError.wrap(result.error).response();
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
      ...result.value,
    },
  };
};

const verify = async ({
  body,
  auth,
}: ApiRequest): Promise<ApiResponse<VerifyTokenResult>> => {
  const jwt = decodeAuthHeader(auth);
  if (jwt.isFailure()) return jwt.error.response();
  const json = decodeRequestBody(
    Object.assign(body, jwt),
    VerifyTokenParams.asDecoder()
  );
  if (json.isFailure()) return json.error.response();
  const result = await AppModel.accounts.verifyToken(json.value);
  if (result.isFailure()) return ApiError.wrap(result.error).response();
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
    },
  };
};

export const jwtRouter = () => {
  const router = express.Router();
  router.post("/sign", requestHandler(sign));
  router.post("/verify", requestHandler(verify));
  return router;
};
