export const hasProperty = <P extends string>(
  obj: unknown,
  prop: P
): obj is { [key in P]: unknown } =>
  typeof obj === "object" && obj != null && prop in obj;
