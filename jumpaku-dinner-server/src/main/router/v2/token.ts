import express from "express";
import { AppDatabasePool } from "../../AppDatabasePool";
import {
  Accounts,
  SignTokenParams as SignTokenParams,
  SignTokenResult as SignTokenResult,
  VerifyTokenParams,
  VerifyTokenResult,
} from "../../lib/app/accounts/Accounts";
import { ApiError } from "../../lib/rest/ApiError";
import { decodeAuthHeader } from "../../lib/rest/decodeAuthHeader";
import { decodeRequestBody } from "../../lib/rest/decodeRequestBody";
import { ApiRequest, ApiResponse } from "../../lib/rest/requestHandler";
import { Status } from "../../lib/rest/status";

async function sign({
  body,
}: ApiRequest): Promise<ApiResponse<SignTokenResult>> {
  const json = decodeRequestBody(body, SignTokenParams.asDecoder());
  if (json.isFailure()) return json.error.response();
  const result = await new Accounts(AppDatabasePool.get()).signToken(
    json.value
  );
  if (result.isFailure()) return ApiError.by(result.error).response();
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
      ...result.value,
    },
  };
}

async function verify({
  body,
  auth,
}: ApiRequest): Promise<ApiResponse<VerifyTokenResult>> {
  const jwt = decodeAuthHeader(auth);
  if (jwt.isFailure()) return jwt.error.response();
  const json = decodeRequestBody(
    Object.assign(body, jwt),
    VerifyTokenParams.asDecoder()
  );
  if (json.isFailure()) return json.error.response();
  const result = await new Accounts(AppDatabasePool.get()).verifyToken(
    json.value
  );
  if (result.isFailure()) return ApiError.by(result.error).response();
  return {
    status: Status.Ok,
    body: {
      tag: "Success",
    },
  };
}

export const jwtRouter = () => {
  const router = express.Router();
  router.post("/sign", sign);
  router.post("/verify", verify);
  return router;
};
