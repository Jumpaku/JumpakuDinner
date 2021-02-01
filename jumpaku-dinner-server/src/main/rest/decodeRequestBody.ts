import typing from "io-ts";
import { failure, Result, success } from "../common/result";
import { ApiError } from "./ApiError";

export function decodeRequestBody<D>(
  data: unknown,
  decoder: typing.Decoder<unknown, D>
): Result<D, ApiError> {
  const result = decoder.decode(data);
  return result._tag === "Right"
    ? success(result.right)
    : failure(
        ApiError.by(
          result.left,
          "InvalidParams",
          `Request body cannot be parsed as ${decoder.name}`
        )
      );
}
