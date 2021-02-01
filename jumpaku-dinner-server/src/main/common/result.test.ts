import { describe, expect, test, it } from "@jest/globals";
import {
  success,
  failure,
  resultOf,
  resultOfAsync,
  tryCatch,
  ResultError,
} from "./result";

describe("Generating Results", () => {
  it("generates success", () => {
    const { value, error, errorHistory } = success(1);
    expect(value).toEqual(1);
    expect(error).toEqual(undefined);
    expect(errorHistory).toEqual(undefined);
  });

  describe("failure", () => {
    const { value, error, errorHistory } = failure("Error");
    expect(value).toEqual(undefined);
    expect(error).toEqual("Error");
    expect(errorHistory).toEqual(["Error"]);
  });

  describe("resultOf", () => {
    it("generates success without catching", () => {
      const { value, error, errorHistory } = resultOf(() => 1);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
      expect(errorHistory).toEqual(undefined);
    });

    it("generates success with catching", () => {
      const { value, error, errorHistory } = resultOf(
        () => 1,
        (e) => "Caught"
      );
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
      expect(errorHistory).toEqual(undefined);
    });

    it("generates failure with unknown error", () => {
      const { value, error, errorHistory } = resultOf(() => {
        throw "Error";
      });
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
      expect(errorHistory).toEqual(["Error"]);
    });

    it("generates failure catching error", () => {
      const { value, error, errorHistory } = resultOf(
        () => {
          throw "Error";
        },
        (e) => "Caught"
      );
      expect(value).toEqual(undefined);
      expect(error).toEqual("Caught");
      expect(errorHistory).toEqual(["Caught"]);
    });
  });

  describe("tryCatch generates a function", () => {
    it("returns success without catching", () => {
      const { value, error, errorHistory } = tryCatch(() => 1)();
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
      expect(errorHistory).toEqual(undefined);
    });

    it("returns success with catching", () => {
      const { value, error, errorHistory } = tryCatch(
        () => 1,
        (e) => "Caught"
      )();
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
      expect(errorHistory).toEqual(undefined);
    });

    it("returns failure with unknown error", () => {
      const { value, error, errorHistory } = tryCatch(() => {
        throw "Error";
      })();
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
      expect(errorHistory).toEqual(["Error"]);
    });
    it("returns failure catching error", () => {
      const { value, error, errorHistory } = tryCatch(
        () => {
          throw "Error";
        },
        (e) => "Caught"
      )();
      expect(value).toEqual(undefined);
      expect(error).toEqual("Caught");
      expect(errorHistory).toEqual(["Caught"]);
    });
  });

  describe("resultOfAsync generates a promise ", () => {
    it("resolves success without catching", async () => {
      const a = resultOfAsync(async () => 1);
      await expect(a.then(({ value }) => value)).resolves.toEqual(1);
      await expect(a.then(({ error }) => error)).resolves.toEqual(undefined);
      await expect(a.then(({ errorHistory }) => errorHistory)).resolves.toEqual(
        undefined
      );
    });
    it("resolves success with catching", async () => {
      const a = resultOfAsync(
        async () => 1,
        (e) => "Caught"
      );
      await expect(a.then(({ value }) => value)).resolves.toEqual(1);
      await expect(a.then(({ error }) => error)).resolves.toEqual(undefined);
      await expect(a.then(({ errorHistory }) => errorHistory)).resolves.toEqual(
        undefined
      );
    });

    it("resolves failure with unknown error", async () => {
      const a = resultOfAsync(() => {
        throw "Error";
      });
      await expect(a.then(({ value }) => value)).resolves.toEqual(undefined);
      await expect(a.then(({ error }) => error)).resolves.toEqual("Error");
      await expect(
        a.then(({ errorHistory }) => errorHistory)
      ).resolves.toEqual(["Error"]);
    });
    it("resolves failure catching error", async () => {
      const a = resultOfAsync(
        async () => {
          throw "Error";
        },
        (e) => "Caught"
      );
      await expect(a.then(({ value }) => value)).resolves.toEqual(undefined);
      await expect(a.then(({ error }) => error)).resolves.toEqual("Caught");
      await expect(
        a.then(({ errorHistory }) => errorHistory)
      ).resolves.toEqual(["Caught"]);
    });
  });
});

describe("Methods of Success", () => {
  const a = resultOf(
    () => 1,
    () => "Error"
  );
  test("isSuccess", () => {
    expect(a.isSuccess()).toEqual(true);
  });
  test("isFailure", () => {
    expect(a.isFailure()).toEqual(false);
  });
  test("orDefault", () => {
    expect(a.orDefault(2)).toEqual(1);
  });
  test("orBuild", () => {
    expect(a.orRecover(() => 2)).toEqual(1);
  });
  test("orThrow", () => {
    expect(a.orThrow()).toEqual(1);
  });
  test("orThrow (Error given)", () => {
    expect(a.orThrow(() => new Error(""))).toEqual(1);
  });
  test("orNull", () => {
    expect(a.orNull()).toEqual(1);
  });
  test("orUndefined", () => {
    expect(a.orUndefined()).toEqual(1);
  });
  test("map", () => {
    const { value, error, errorHistory } = a.map((v) => `${v + 1}`);
    expect(value).toEqual("2");
    expect(error).toEqual(undefined);
    expect(errorHistory).toEqual(undefined);
  });
  describe("flatMap", () => {
    it("successfully maps", () => {
      const { value, error, errorHistory } = a.flatMap((v) => success(v + 1));
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
      expect(errorHistory).toEqual(undefined);
    });

    it("fails", () => {
      const { value, error, errorHistory } = a.flatMap(() =>
        failure("Next Error")
      );
      expect(value).toEqual(undefined);
      expect(error).toEqual("Next Error");
      expect(errorHistory).toEqual(["Next Error"]);
    });
  });
  test("recover", () => {
    const { value, error, errorHistory } = a.recover(() => 2);
    expect(value).toEqual(1);
    expect(error).toEqual(undefined);
    expect(errorHistory).toEqual(undefined);
  });
  describe("flatRecover", () => {
    it("does nothing when source is success", () => {
      const { value, error, errorHistory } = a.flatRecover(() => success(2));
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
      expect(errorHistory).toEqual(undefined);
    });

    it("does nothing even if recovery fails", () => {
      const { value, error, errorHistory } = a.flatRecover(() =>
        failure("Error")
      );
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
      expect(errorHistory).toEqual(undefined);
    });
  });
  test("mapErrors", () => {
    const { value, error, errorHistory } = a.mapErrors(() => "Mapped");
    expect(value).toEqual(1);
    expect(error).toEqual(undefined);
    expect(errorHistory).toEqual(undefined);
  });
  test("onSuccess", () => {
    let x = 0;
    a.onSuccess((v) => {
      x = 1;
    });
    expect(x).toEqual(1);
  });
  test("onFailure", () => {
    let x = 0;
    a.onFailure((e) => {
      x = 1;
    });
    expect(x).toEqual(0);
  });
});

describe("Methods of Failure", () => {
  const a = resultOf(
    () => {
      throw undefined;
      return 1;
    },
    () => "Error"
  );
  test("isSuccess", () => {
    expect(a.isSuccess()).toEqual(false);
  });
  test("isFailure", () => {
    expect(a.isFailure()).toEqual(true);
  });
  test("orDefault", () => {
    expect(a.orDefault(2)).toEqual(2);
  });
  test("orRecover", () => {
    expect(a.orRecover(() => 2)).toEqual(2);
  });
  test("orThrow", () => {
    expect(() => a.orThrow()).toThrow(new ResultError("Error"));
  });
  test("orThrow (Error given)", () => {
    expect(() => a.orThrow(() => new Error("Given error"))).toThrow(
      new Error("Given error")
    );
  });
  test("orNull", () => {
    expect(a.orNull()).toEqual(null);
  });
  test("orUndefined", () => {
    expect(a.orUndefined()).toEqual(undefined);
  });
  test("map", () => {
    const { value, error, errorHistory } = a.map((v) => `${v + 1}`);
    expect(value).toEqual(undefined);
    expect(error).toEqual("Error");
    expect(errorHistory).toEqual(["Error"]);
  });
  describe("flatMap", () => {
    it("is already failed", () => {
      const { value, error, errorHistory } = a.flatMap((v) => success(v + 1));
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
      expect(errorHistory).toEqual(["Error"]);
    });

    it("has still previous error", () => {
      const { value, error, errorHistory } = a.flatMap(() =>
        failure("Next Error")
      );
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
      expect(errorHistory).toEqual(["Error"]);
    });
  });
  test("recover", () => {
    const { value, error, errorHistory } = a.recover(() => 2);
    expect(value).toEqual(2);
    expect(error).toEqual(undefined);
    expect(errorHistory).toEqual(undefined);
  });
  describe("flatRecover", () => {
    it("succeeds with recovered value", () => {
      const { value, error, errorHistory } = a.flatRecover(() => success(2));
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
      expect(errorHistory).toEqual(undefined);
    });

    it("fails with new error", () => {
      const { value, error, errorHistory } = a.flatRecover((e) =>
        failure("Next Error")
      );
      expect(value).toEqual(undefined);
      expect(error).toEqual("Next Error");
      expect(errorHistory).toEqual(["Error", "Next Error"]);
    });
  });
  test("mapFailure", () => {
    const { value, error, errorHistory } = a.mapErrors(() => "Mapped");
    expect(value).toEqual(undefined);
    expect(error).toEqual("Mapped");
    expect(errorHistory).toEqual(["Mapped"]);
  });
  test("onSuccess", () => {
    let x = 0;
    a.onSuccess((v) => {
      x = 1;
    });
    expect(x).toEqual(0);
  });
  test("onFailure", () => {
    let x = 0;
    a.onFailure((e) => {
      x = 1;
    });
    expect(x).toEqual(1);
  });
});