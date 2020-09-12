import * as React from "react";

export interface HelloProps { compiler: string; framework: string; builer: string }

export const Hello = (props: HelloProps) => <h1>Hello from {props.compiler} and {props.framework} on {props.builer}!</h1>;