import express from "express";
import { AppState } from "../state/AppState";
import { accountsRouter } from "./v2/accounts";
import { tokenRouter } from "./v2/token";

export const v2Router = (state: AppState) =>
  express
    .Router()
    .use(express.json())
    .use("/accounts", accountsRouter(state))
    .use("/token", tokenRouter(state))
    .get("/", (req, res) => res.send("Jumpaku Dinner API v2"));
