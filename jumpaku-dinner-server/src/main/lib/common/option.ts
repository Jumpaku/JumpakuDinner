interface IOption<T> {
  isSome(): this is Some<T>;
  isNone(): this is None<T>;
  flatMap<U>(f: (value: T) => Option<U>): Option<U>;
  map<U>(f: (value: T) => U): Option<U>;
  orDefault(value: T): T;
  orBuild(f: () => T): T;
  orThrow<E>(f?: () => E): T;
  orNull(): T | null;
  orUndefined(): T | undefined;
  asArray(): [] | [T];
  filter(f: (value: T) => boolean): Option<T>;
  filterIfNullable(): Option<NonNullable<T>>;
  ifPresent(f: (value: T) => void): Option<T>;
  ifAbsent(f: () => void): Option<T>;
  and<U>(other: Option<U>): Option<T | U>;
  or<U>(other: Option<U>): Option<T | U>;
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
  asArray(): [] | [T] {
    return [this.value];
  }
  filter(f: (value: T) => boolean): Option<T> {
    return f(this.value) ? this : none();
  }
  filterIfNullable(): Option<NonNullable<T>> {
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
    return this;
  }
  or<U>(other: Option<U>): Option<T | U> {
    return other;
  }
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
  asArray(): [] | [T] {
    return [];
  }
  filter(f: (value: T) => boolean): Option<T> {
    return this;
  }
  filterIfNullable(): Option<NonNullable<T>> {
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
    return other;
  }
  or<U>(other: Option<U>): Option<T | U> {
    return this;
  }
}

type Option<T> = Some<T> | None<T>;

function none<T = never>(): Option<T> {
  return None.instance;
}

function some<T>(value: T) {
  return new Some<T>(value);
}

function nonNull<T>(nullable: T): Option<NonNullable<T>> {
  return ((a: T): a is NonNullable<T> => a != null)(nullable)
    ? some(nullable)
    : none();
}
