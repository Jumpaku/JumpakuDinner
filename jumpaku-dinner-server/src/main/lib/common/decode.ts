import typing from "io-ts";
import { failure, Result, success } from "./result";

export function decode<T>(
  value: unknown,
  decoder: typing.Decoder<unknown, T>
): Result<T, Error> {
  const result = decoder.decode(value);

  return result._tag === "Right"
    ? success(result.right)
    : failure(
        new Error(
          "Decode Error: [" + result.left.map((it) => JSON.stringify(it)) + "]"
        )
      );
}
