import { panic } from "./panic";

interface IOption<T> extends ArrayLike<T>, Iterable<T> {
  isSome(): this is Some<T>;
  isNone(): this is None<T>;
  map<U>(f: (value: T) => U): Option<U>;
  flatMap<U>(f: (value: T) => Option<U>): Option<U>;
  orDefault(value: T): T;
  orBuild(f: () => T): T;
  orThrow<E>(f?: () => E): T;
  orNull(): T | null;
  orUndefined(): T | undefined;
  takeIf(f: (value: T) => boolean): Option<T>;
  takeIfNotNull(): Option<NonNullable<T>>;
  ifPresent(f: (value: T) => void): Option<T>;
  ifAbsent(f: () => void): Option<T>;
  and<U>(other: Option<U>): Option<T | U>;
  or<U>(other: Option<U>): Option<T | U>;
  readonly length: 0 | 1;
  [index: number]: T;
  [Symbol.iterator]: () => Iterator<T>;
}

class Some<T> implements IOption<T> {
  constructor(readonly value: T) {}
  isSome(): this is Some<T> {
    return true;
  }
  isNone(): this is None<T> {
    return false;
  }
  flatMap<U>(f: (value: T) => Option<U>): Option<U> {
    return f(this.value);
  }
  map<U>(f: (value: T) => U): Option<U> {
    return new Some(f(this.value));
  }
  orDefault(value: T): T {
    return this.value;
  }
  orBuild(f: () => T): T {
    return this.value;
  }
  orThrow<E>(f?: () => E): T {
    return this.value;
  }
  orNull(): T | null {
    return this.value;
  }
  orUndefined(): T | undefined {
    return this.value;
  }
  takeIf(f: (value: T) => boolean): Option<T> {
    return f(this.value) ? this : none();
  }
  takeIfNotNull(): Option<NonNullable<T>> {
    return nonNull(this.value);
  }
  ifPresent(f: (value: T) => void): Option<T> {
    f(this.value);
    return this;
  }
  ifAbsent(f: () => void): Option<T> {
    return this;
  }
  and<U>(other: Option<U>): Option<T | U> {
    return other;
  }
  or<U>(other: Option<U>): Option<T | U> {
    return this;
  }
  readonly length = 1;
  [index: number]: T;
  0 = this.value;
  [Symbol.iterator] = (): Iterator<T> => {
    const value = this.value;
    return (function* () {
      yield value;
    })();
  };
}

class None<T = never> implements IOption<T> {
  static readonly instance = new None();
  private constructor() {}
  isSome(): this is Some<T> {
    return false;
  }
  isNone(): this is None<T> {
    return true;
  }
  flatMap<U>(f: (value: T) => Option<U>): Option<U> {
    return None.instance;
  }
  map<U>(f: (value: T) => U): Option<U> {
    return None.instance;
  }
  orDefault(value: T): T {
    return value;
  }
  orBuild(f: () => T): T {
    return f();
  }
  orThrow<E>(f?: () => E): T {
    throw f != null ? f() : new Error("Option is None.");
  }
  orNull(): T | null {
    return null;
  }
  orUndefined(): T | undefined {
    return undefined;
  }
  takeIf(f: (value: T) => boolean): Option<T> {
    return this;
  }
  takeIfNotNull(): Option<NonNullable<T>> {
    return None.instance;
  }
  ifPresent(f: (value: T) => void): Option<T> {
    return this;
  }
  ifAbsent(f: () => void): Option<T> {
    f();
    return this;
  }
  and<U>(other: Option<U>): Option<T | U> {
    return this;
  }
  or<U>(other: Option<U>): Option<T | U> {
    return other;
  }
  readonly length = 0;
  [index: number]: T;
  [Symbol.iterator] = (): Iterator<T> => (function* () {})();
}

export type Option<T> = Some<T> | None<T>;

export function none<T = never>(): Option<T> {
  return None.instance;
}

export function some<T>(value: T): Option<T> {
  return new Some<T>(value);
}

export function nonNull<T>(nullable: T): Option<NonNullable<T>> {
  return ((a: T): a is NonNullable<T> => a != null)(nullable)
    ? some(nullable)
    : none();
}
