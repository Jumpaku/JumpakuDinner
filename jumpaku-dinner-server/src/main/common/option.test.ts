import { describe, expect, test } from "@jest/globals";
import { nonNull, none, some } from "./Option";

describe("Creation of Option", () => {
  test("none()", () => {
    const a = none();
    expect(a.isNone()).toEqual(true);
    expect(a.isSome()).toEqual(false);
  });
  test("some(1)", () => {
    const a = some(1);
    expect(a.isNone()).toEqual(false);
    expect(a.isSome()).toEqual(true);
    expect(a.isSome() && a.value).toEqual(1);
  });
  test("some(null) is not None", () => {
    const a = some(null);
    expect(a.isNone()).toEqual(false);
    expect(a.isSome()).toEqual(true);
    expect(a.isSome() && a.value).toEqual(null);
  });
  test("some(undefined) is not None", () => {
    const a = some(undefined);
    expect(a.isNone()).toEqual(false);
    expect(a.isSome()).toEqual(true);
    expect(a.isSome() && a.value).toEqual(undefined);
  });
  test("nonNull() with null", () => {
    const a = nonNull((() => null as any)());
    expect(a.isNone()).toEqual(true);
    expect(a.isSome()).toEqual(false);
  });
  test("nonNull() with undefined", () => {
    const a = nonNull((() => undefined as any)());
    expect(a.isNone()).toEqual(true);
    expect(a.isSome()).toEqual(false);
  });
  test("nonNull() with 1", () => {
    const a = nonNull((() => 1 as any)());
    expect(a.isNone()).toEqual(false);
    expect(a.isSome()).toEqual(true);
    expect(a.isSome() && a.value).toEqual(1);
  });
});

describe("Some", () => {
  const o = some(1);
  test("isSome()", () => {
    expect(o.isSome()).toEqual(true);
  });
  test("isNone()", () => {
    expect(o.isNone()).toEqual(false);
  });
  test("orDefault()", () => {
    const a = o.orDefault(2);
    expect(a).toEqual(1);
  });
  test("orBuild()", () => {
    const a = o.orBuild(() => 2);
    expect(a).toEqual(1);
  });
  test("orThrow()", () => {
    const a = o.orThrow(() => 2);
    expect(a).toEqual(1);
  });
  test("orThrow() with () => 'No element'", () => {
    const a = o.orThrow(() => "No element");
    expect(a).toEqual(1);
  });
  test("orNull()", () => {
    const a = o.orNull();
    expect(a).toEqual(1);
  });
  test("orUndefined()", () => {
    const a = o.orUndefined();
    expect(a).toEqual(1);
  });
  test("map()", () => {
    const a = o.map((it) => `${it + 1}`);
    expect(a.isSome()).toEqual(true);
    expect(a.orThrow()).toEqual("2");
  });
  test("flatMap() with () => some('2')", () => {
    const a = o.flatMap(() => some("2"));
    expect(a.isSome()).toEqual(true);
    expect(a.orThrow()).toEqual("2");
  });
  test("flatMap() with () => none()", () => {
    const a = o.flatMap(() => none());
    expect(a.isNone()).toEqual(true);
  });
  describe("Filters", () => {
    test("takeIf() with () => false", () => {
      const a = o.takeIf(() => false);
      expect(a.isNone()).toEqual(true);
    });
    test("takeIf() with () => true", () => {
      const a = o.takeIf(() => true);
      expect(a.isSome()).toEqual(true);
      expect(a.orThrow()).toEqual(1);
    });
    test("takeIfNotNull() does not convert some(1)", () => {
      const a = o.takeIfNotNull();
      expect(a.isSome()).toEqual(true);
      expect(a.orThrow()).toEqual(1);
    });
    test("takeIfNotNull() converts some(null) into none()", () => {
      const a = some(null).takeIfNotNull();
      expect(a.isNone()).toEqual(true);
    });
    test("takeIfNotNull() converts some(undefined) into none()", () => {
      const a = some(undefined).takeIfNotNull();
      expect(a.isNone()).toEqual(true);
    });
  });
  test("ifPresent", () => {
    let x: number = 0;
    o.ifPresent((v) => {
      x = v;
    });
    expect(x).toEqual(1);
  });
  test("ifAbsent", () => {
    let x: number = 0;
    o.ifAbsent(() => {
      x = 2;
    });
    expect(x).toEqual(0);
  });
  test("and() with some('A')", () => {
    const a = o.and(some("A"));
    expect(a.isSome()).toEqual(true);
    expect(a.orThrow()).toEqual("A");
  });
  test("and() with none()", () => {
    const a = o.and(none());
    expect(a.isNone()).toEqual(true);
  });
  test("or() with some('A')", () => {
    const a = o.or(some("A"));
    expect(a.isSome()).toEqual(true);
    expect(a.orThrow()).toEqual(1);
  });
  test("or() with none()", () => {
    const a = o.or(none());
    expect(a.isSome()).toEqual(true);
    expect(a.orThrow()).toEqual(1);
  });
  test("length", () => {
    expect(o.length).toEqual(1);
  });
  test("indexer", () => {
    expect(o[0]).toEqual(1);
    expect(o[1]).toEqual(undefined);
  });
  test("[Symbol.iterator]()", () => {
    const a = o[Symbol.iterator]();
    const a0 = a.next();
    const a1 = a.next();
    expect(a0).toEqual({ value: 1, done: false });
    expect(a1).toEqual({ value: undefined, done: true });
  });
});

describe("None", () => {
  const o = none<number>();
  test("isSome()", () => {
    expect(o.isSome()).toEqual(false);
  });
  test("isNone()", () => {
    expect(o.isNone()).toEqual(true);
  });
  test("orDefault()", () => {
    const a = o.orDefault(2);
    expect(a).toEqual(2);
  });
  test("orBuild()", () => {
    const a = o.orBuild(() => 2);
    expect(a).toEqual(2);
  });
  test("orThrow()", () => {
    expect(() => o.orThrow()).toThrow(new Error("Option is None."));
  });
  test("orThrow() with () => 'No element'", () => {
    expect(() => o.orThrow(() => "No element")).toThrow("No element");
  });
  test("orNull()", () => {
    const a = o.orNull();
    expect(a).toEqual(null);
  });
  test("orUndefined()", () => {
    const a = o.orUndefined();
    expect(a).toEqual(undefined);
  });
  test("map()", () => {
    const a = o.map((it) => `${it + 1}`);
    expect(a.isNone()).toEqual(true);
  });
  test("flatMap() with () => some('2')", () => {
    const a = o.flatMap(() => some("2"));
    expect(a.isNone()).toEqual(true);
  });
  test("flatMap() with () => none()", () => {
    const a = o.flatMap(() => none());
    expect(a.isNone()).toEqual(true);
  });
  describe("Filters", () => {
    test("takeIf() with () => false", () => {
      const a = o.takeIf(() => false);
      expect(a.isNone()).toEqual(true);
    });
    test("takeIf() with () => true", () => {
      const a = o.takeIf(() => true);
      expect(a.isNone()).toEqual(true);
    });
    test("takeIfNotNull()", () => {
      const a = o.takeIfNotNull();
      expect(a.isNone()).toEqual(true);
    });
  });
  test("ifPresent", () => {
    let x: number = 0;
    o.ifPresent((v) => {
      x = v;
    });
    expect(x).toEqual(0);
  });
  test("ifAbsent", () => {
    let x: number = 0;
    o.ifAbsent(() => {
      x = 2;
    });
    expect(x).toEqual(2);
  });
  test("and() with some('A')", () => {
    const a = o.and(some("A"));
    expect(a.isNone()).toEqual(true);
  });
  test("and() with none()", () => {
    const a = o.and(none());
    expect(a.isNone()).toEqual(true);
  });
  test("or() with some('A')", () => {
    const a = o.or(some("A"));
    expect(a.isSome()).toEqual(true);
    expect(a.orThrow()).toEqual("A");
  });
  test("or() with none()", () => {
    const a = o.or(none());
    expect(a.isNone()).toEqual(true);
  });
  test("length", () => {
    expect(o.length).toEqual(0);
  });
  test("indexer [0]", () => {
    expect(o[0]).toEqual(undefined);
    expect(o[1]).toEqual(undefined);
  });
  test("[Symbol.iterator]()", () => {
    const a = o[Symbol.iterator]();
    const a0 = a.next();
    const a1 = a.next();
    expect(a0).toEqual({ value: undefined, done: true });
    expect(a1).toEqual({ value: undefined, done: true });
  });
});
