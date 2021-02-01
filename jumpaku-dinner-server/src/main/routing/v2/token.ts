import express from "express";
import { AppState } from "../../state/AppState";
import { IssueHandler } from "../../rest/handlers/IssueHandler";
import { VerifyHandler } from "../../rest/handlers/VerifyHandler";

export const tokenRouter = (state: AppState) => {
  const router = express.Router();
  router.post("/issue", new IssueHandler(state).handler());
  router.post("/verify", new VerifyHandler(state).handler());
  return router;
};
