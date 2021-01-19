import express from "express";
import { signupRouter } from "./v2/signup";

export const v2Router = () => {
  const router = express.Router();
  router.use(express.json());
  router.use("/signup", signupRouter());
  return router;
};
