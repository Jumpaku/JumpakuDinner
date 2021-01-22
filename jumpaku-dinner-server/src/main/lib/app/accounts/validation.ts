import validator from "validator";
import { Result } from "../../common/result";
import { ValidationError, Validator } from "../Validator";

export function validateLoginId(
  loginId: unknown
): Result<string, ValidationError> {
  return new Validator([
    [(loginId) => !validator.isEmpty(loginId), "loginId must be not empty"],
    [
      (loginId) => !validator.matches(loginId, /^.*[\p{Cc}\p{Cf}\s]+.*$/su),
      "loginId must not contain control character or spaces",
    ],
    [
      (loginId) => validator.isLength(loginId, { min: 1, max: 50 }),
      "loginId must be length of [1, 50]",
    ],
    [
      (loginId) => validator.isAscii(loginId),
      "loginId must contain only ASCII characters",
    ],
  ]).validate(loginId);
}

export function validatePassword(
  password: unknown
): Result<string, ValidationError> {
  return new Validator([
    [
      (password) => validator.isAscii(password),
      "password must contain only ASCII characters",
    ],
    [
      (password) => !validator.matches(password, /^.*[\p{Cc}\p{Cf}\s]+.*$/su),
      "password must not contain control characters or spaces",
    ],
    [
      (password) => validator.isLength(password, { min: 8, max: 128 }),
      "password must be length in [8, 128]",
    ],
  ]).validate(password);
}

export function validateDisplayName(
  displayName: unknown
): Result<string, ValidationError> {
  return new Validator([
    [
      (displayName) => !validator.isEmpty(displayName),
      "displayName must be not empty",
    ],
    [
      (displayName) =>
        !validator.matches(displayName, /^.*[\p{Cc}\p{Cf}\s]+.*$/su),
      "displayName must not contain control character or spaces",
    ],
    [
      (displayName) => validator.isLength(displayName, { min: 1, max: 50 }),
      "displayName must be length of [1, 50]",
    ],
  ]).validate(displayName);
}
