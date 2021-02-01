import * as typing from "io-ts";
export const X = typing.type({});
export type QueryStatement = {
  name?: string;
  text: string;
  values: (string | number | boolean | Date | null | undefined)[];
};

export function sql(
  template: TemplateStringsArray,
  ...substitutions: QueryStatement["values"]
): QueryBuilder;
export function sql(
  name: string
): (
  template: TemplateStringsArray,
  ...substitutions: QueryStatement["values"]
) => QueryBuilder;
export function sql(
  nameOrTemplate: string | TemplateStringsArray,
  ...substitutions: QueryStatement["values"]
):
  | QueryBuilder
  | ((
      template: TemplateStringsArray,
      ...substitutions: QueryStatement["values"]
    ) => QueryBuilder) {
  if (typeof nameOrTemplate === "string")
    return (
      template: TemplateStringsArray,
      ...substitutions: QueryStatement["values"]
    ): QueryBuilder =>
      new NamedQueryBuilder(
        nameOrTemplate,
        String.raw(template, ...substitutions)
      );
  return new QueryBuilder(String.raw(nameOrTemplate, ...substitutions));
}

export class QueryBuilder {
  readonly values: QueryStatement["values"] = [];
  constructor(readonly text: string) {}
  with(
    ...values: (string | number | boolean | Date | null | undefined)[]
  ): QueryStatement {
    return { text: this.text, values: values };
  }
}

export class NamedQueryBuilder extends QueryBuilder {
  constructor(readonly name: string, readonly text: string) {
    super(text);
  }
  with(
    ...values: (string | number | boolean | Date | null | undefined)[]
  ): QueryStatement {
    return { name: this.name, text: this.text, values: values };
  }
}
