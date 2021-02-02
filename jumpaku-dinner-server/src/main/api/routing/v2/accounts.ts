import express from "express";
import { SignupHandler } from "../../handlers/SignupHandler";
import { CloseHandler } from "../../handlers/CloseHandler";
import { AppState } from "../../../state/AppState";

export const accountsRouter = (state: AppState) => {
  const router = express.Router();
  router.post("/signup", new SignupHandler(state).handler());
  router.post("/close", new CloseHandler(state).handler());
  return router;
};
