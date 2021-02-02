import { BaseError } from "make-error-cause";

export class ResultError<E> extends BaseError {
  readonly name: string = "ResultError";
  readonly detail: E;
  constructor(error: E) {
    super(
      error instanceof Error ? error.message : "",
      error instanceof Error ? error : undefined
    );
    this.detail = error;
  }
}

interface IResult<V, E> {
  isSuccess(): this is Success<V, E>;
  isFailure(): this is Failure<V, E>;
  map<U>(f: (value: V) => U): Result<U, E>;
  flatMap<U, F>(f: (value: V) => Result<U, F>): Result<U, E | F>;
  recover(f: (errors: E) => V): Result<V, E>;
  flatRecover<F>(f: (errors: E) => Result<V, F>): Result<V, E | F>;
  mapErrors<F>(f: (errors: E) => F): Result<V, F>;
  onSuccess(f: (value: V) => void): Result<V, E>;
  onFailure(f: (errors: E) => void): Result<V, E>;
  orDefault(value: V): V;
  orRecover(f: (errors: E) => V): V;
  orThrow<E>(f?: () => E): V;
  orNull(): V | null;
  orUndefined(): V | undefined;
  and<U, F>(other: Result<U, F>): Result<V | U, E | F>;
  or<U, F>(other: Result<U, F>): Result<V | U, E | F>;
}

export class Success<V, E> implements IResult<V, E> {
  constructor(readonly value: V) {}
  readonly error = undefined;
  orDefault(value: V): V {
    return this.value;
  }
  orRecover(f: (error: E) => V): V {
    return this.value;
  }
  orThrow<E>(f?: () => E): V {
    return this.value;
  }
  orNull(): V | null {
    return this.value;
  }
  orUndefined(): V | undefined {
    return this.value;
  }
  isSuccess(): this is Success<V, E> {
    return true;
  }
  isFailure(): this is Failure<V, E> {
    return false;
  }
  map<U>(f: (value: V) => U): Result<U, E> {
    return new Success(f(this.value));
  }
  flatMap<U, F>(f: (value: V) => Result<U, F>): Result<U, F | E> {
    return f(this.value);
  }
  recover(f: (error: E) => V): Result<V, E> {
    return this;
  }
  flatRecover<F>(f: (error: E) => Result<V, F>): Result<V, E | F> {
    return (this as any) as Success<V, F>;
  }
  mapErrors<F>(f: (error: E) => F): Result<V, F> {
    return (this as any) as Success<V, F>;
  }
  onSuccess(f: (value: V) => void): Result<V, E> {
    f(this.value);
    return this;
  }
  onFailure(f: (error: E) => void): Result<V, E> {
    return this;
  }
  and<U, F>(other: Result<U, F>): Result<V | U, E | F> {
    return other;
  }
  or<U, F>(other: Result<U, F>): Result<V | U, E | F> {
    return this;
  }
}

export class Failure<V, E> implements IResult<V, E> {
  constructor(readonly error: E) {}
  readonly value = undefined;
  orDefault(value: V): V {
    return value;
  }
  orRecover(f: (error: E) => V): V {
    return f(this.error);
  }
  orThrow<E>(f?: () => E): V {
    throw f != null ? f() : new ResultError(this.error);
  }
  orNull(): V | null {
    return null;
  }
  orUndefined(): V | undefined {
    return undefined;
  }
  isSuccess(): this is Success<V, E> {
    return false;
  }
  isFailure(): this is Failure<V, E> {
    return true;
  }
  map<U>(f: (value: V) => U): Result<U, E> {
    return (this as any) as Failure<U, E>;
  }
  flatMap<U, F>(f: (value: V) => Result<U, F>): Result<U, E | F> {
    return (this as any) as Failure<U, E>;
  }
  recover(f: (error: E) => V): Result<V, E> {
    return new Success<V, E>(f(this.error));
  }
  flatRecover<F>(f: (error: E) => Result<V, F>): Result<V, E | F> {
    return f(this.error);
  }
  mapErrors<F>(f: (error: E) => F): Result<V, F> {
    return new Failure<V, F>(f(this.error));
  }
  onSuccess(f: (value: V) => void): Result<V, E> {
    return this;
  }
  onFailure(f: (error: E) => void): Result<V, E> {
    f(this.error);
    return this;
  }
  and<U, F>(other: Result<U, F>): Result<V | U, E | F> {
    return this;
  }
  or<U, F>(other: Result<U, F>): Result<V | U, E | F> {
    return other;
  }
}

export type Result<V, E> = IResult<V, E> &
  ({ value: V; error: undefined } | { value: undefined; error: E });

export function resultOf<V>(f: () => V): Result<V, unknown>;
export function resultOf<V, E>(
  f: () => V,
  catcher: (error: unknown) => E
): Result<V, E>;
export function resultOf<V, E>(
  f: () => V,
  catcher?: (error: unknown) => E
): Result<V, unknown> | Result<V, E> {
  try {
    return new Success(f());
  } catch (error: unknown) {
    return catcher == null ? new Failure(error) : new Failure(catcher(error));
  }
}
export function tryCatch<V>(f: () => V): () => Result<V, unknown>;
export function tryCatch<V, E>(
  f: () => V,
  catcher: (error: unknown) => E
): () => Result<V, E>;
export function tryCatch<V, E>(
  f: () => V,
  catcher?: (error: unknown) => E
): (() => Result<V, unknown>) | (() => Result<V, E>) {
  return catcher == null ? () => resultOf(f) : () => resultOf(f, catcher);
}

export function resultOfAsync<V>(
  f: () => Promise<V>
): Promise<Result<V, unknown>>;
export function resultOfAsync<V, E>(
  f: () => Promise<V>,
  catcher: (error: unknown) => E
): Promise<Result<V, E>>;
export function resultOfAsync<V, E>(
  f: () => Promise<V>,
  catcher?: (error: unknown) => E
): Promise<Result<V, unknown> | Result<V, E>> {
  const p = new Promise<V>((resolve, reject) => {
    try {
      resolve(f());
    } catch (e: unknown) {
      reject(e);
    }
  });
  return catcher == null
    ? p
        .then((value) => new Success<V, unknown>(value))
        .catch((error) => new Failure<V, unknown>(error))
    : p
        .then((value) => new Success<V, E>(value))
        .catch((error) => new Failure<V, E>(catcher(error)));
}

export function success<V>(value: V): Result<V, never> {
  return new Success<V, never>(value);
}
export function failure<E>(error: E): Result<never, E> {
  return new Failure<never, E>(error);
}
