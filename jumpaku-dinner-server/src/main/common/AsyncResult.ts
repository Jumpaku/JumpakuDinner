import { failure, Result, success } from "./Result";

export class AsyncResult<V, E> {
  static success<V>(v: V): AsyncResult<V, never> {
    return AsyncResult.wrap(success(v));
  }
  static failure<E>(e: E): AsyncResult<never, E> {
    return AsyncResult.wrap(failure(e));
  }

  static try<V>(f: () => V | Promise<V>): AsyncResult<V, unknown>;
  static try<V, E>(
    f: () => V | Promise<V>,
    catcher: (e: unknown) => E
  ): AsyncResult<V, E>;
  static try<V, E>(
    f: () => V | Promise<V>,
    catcher?: (e: unknown) => E
  ): AsyncResult<V, E | unknown> {
    const promise = (async () => f())().then(success);
    return catcher == null
      ? new AsyncResult<V, unknown>(promise.catch((e) => failure(e)))
      : new AsyncResult<V, E>(promise.catch((e) => failure(catcher(e))));
  }

  static wrap<V, E>(result: Result<V, E>): AsyncResult<V, E> {
    return new AsyncResult<V, E>(Promise.resolve(result));
  }

  private constructor(readonly promise: Promise<Result<V, E>>) {}

  value(): Promise<V | undefined> {
    return this.promise.then((r) => r.value);
  }
  error(): Promise<E | undefined> {
    return this.promise.then((r) => r.error);
  }
  orNull(): Promise<V | null> {
    return this.promise.then((r) => r.orNull());
  }
  orUndefined(): Promise<V | undefined> {
    return this.promise.then((r) => r.orUndefined());
  }
  orReject(): Promise<V> {
    return this.promise.then((r) => r.orThrow());
  }
  orDefault(value: V): Promise<V> {
    return this.promise.then((r) => r.orDefault(value));
  }
  orRecover(f: (e: E) => V): Promise<V> {
    return this.promise.then((r) => r.orRecover(f));
  }
  map<U>(f: (v: V) => U | Promise<U>): AsyncResult<U, E> {
    const promise = (async () => {
      const r = await this.promise;
      return r.isSuccess()
        ? Promise.resolve(f(r.value)).then(success)
        : failure(r.error);
    })();
    return new AsyncResult(promise);
  }
  flatMap<U, F>(
    f: (v: V) => AsyncResult<U, F> | Promise<AsyncResult<U, F>>
  ): AsyncResult<U, E | F> {
    const promise = (async () => {
      const r = await this.promise;
      return r.isSuccess() ? (await f(r.value)).promise : failure(r.error);
    })();
    return new AsyncResult<U, E | F>(promise);
  }
  recover(f: (e: E) => V): AsyncResult<V, E> {
    const promise = (async () =>
      this.promise.then((r) => (r.isSuccess() ? r : success(f(r.error)))))();
    return new AsyncResult<V, E>(promise);
  }
  flatRecover<F>(
    f: (e: E) => AsyncResult<V, F> | Promise<AsyncResult<V, F>>
  ): AsyncResult<V, E | F> {
    const promise = (async () => {
      const r = await this.promise;
      return r.isSuccess() ? r : (await f(r.error)).promise;
    })();
    return new AsyncResult<V, E | F>(promise);
  }
  onSuccess(f: (value: V) => void): AsyncResult<V, E> {
    this.promise.then((r) => r.onSuccess(f));
    return this;
  }
  onFailure(f: (e: E) => void): AsyncResult<V, E> {
    this.promise.then((r) => r.onFailure(f));
    return this;
  }
  and<U, F>(other: AsyncResult<U, F>): AsyncResult<V | U, E | F> {
    const promise = (async () => {
      const [r0, r1] = await Promise.all([this.promise, other.promise]);
      return r0.isSuccess() ? r1 : r0;
    })();
    return new AsyncResult<V | U, E | F>(promise);
  }
  or<U, F>(other: AsyncResult<U, F>): AsyncResult<V | U, E | F> {
    const promise = (async () => {
      const [r0, r1] = await Promise.all([this.promise, other.promise]);
      return r0.isSuccess() ? r0 : r1;
    })();
    return new AsyncResult<V | U, E | F>(promise);
  }
}
