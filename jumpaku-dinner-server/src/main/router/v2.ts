import express from "express";
import { accountsRouter } from "./v2/accounts";
import { jwtRouter } from "./v2/token";

export const v2Router = () => {
  const router = express.Router();
  router.use(express.json());
  router.use("/accounts", accountsRouter());
  router.use("/jwt", jwtRouter());
  router.get("/", (req, res) => res.send("Jumpaku Dinner API v2"));
  return router;
};
