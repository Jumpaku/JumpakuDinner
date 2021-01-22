import { failure, Result, success } from "../common/result";
import { BaseError } from "make-error-cause";

export class ValidationError extends BaseError {
  name = "ValidationError";
  constructor(readonly value: string, readonly messages: string[]) {
    super(messages.join(","));
  }
}

export class Validator {
  constructor(readonly validators: [(value: string) => boolean, string][]) {}
  validate(value: unknown): Result<string, ValidationError> {
    if (typeof value !== "string")
      return failure(
        new ValidationError(`${value}`, ["value must be a string"])
      );
    const errors = this.validators.flatMap(([isValid, message]) =>
      isValid(value) ? [] : [message]
    );
    if (errors.length > 0) return failure(new ValidationError(value, errors));
    return success(value);
  }
}
