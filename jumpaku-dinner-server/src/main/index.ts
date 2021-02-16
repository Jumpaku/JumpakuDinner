import express from "express";
import { v2Router } from "./api/routing/v2";
import { createAppState } from "./state/AppState";

import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";

let RedisStore = connectRedis(session);

const main = async () => {
  const { config, state } = (
    await createAppState({
      url: "https://localhost",
      database: {
        databaseName: "postgres_database",
        user: "postgres_user",
        password: "postgres_password",
        host: "test-db",
      },
      jwt: {
        secretKey: "secret key",
      },
    })
  ).orThrow();

  let server = express();

  server.get("/", (req, res) => {
    res.send("Jumpaku Dinner!");
  });
  server.use("/v2", v2Router(state));

  const sessionStore = new RedisStore({
    client: redis.createClient({
      host: "test-db-redis",
      port: 6379,
    }),
  });
  server.use(
    "/web",
    session({
      store: sessionStore,
      secret: "keyboard cat",
      resave: false,
    })
  );
  server.get("/web", (req, res) => {
    res.json(req.session);
  });

  const port = 3000;
  server.listen(port, () => {
    console.log(`Example app listening at ${config.url}`);
  });
};
main();
/*
app.get("/v2/users", (req, res) => {
  res.send(req.url);
  console.log(req.url);
});

app.get("/v2/users/:userId", (req, res) => {
  res.send(req.url);
  console.log(req.url);
});

app.put("/v2/users/:userId", (req, res) => {
  res.send(req.url);
  console.log(req.url);
});

app.post("/v2/signup", (req, res) => {
  res.send(req.url);
  console.log(req.url);
});

app.get("/v2/login", (req, res) => {
  res.send(req.url);
  console.log(req.url);
});

app.post("/v2/login", (req, res) => {
  res.send(req.url);
  console.log(req.url);
});

app.delete("/v2/login", (req, res) => {
  res.send(req.url);
  console.log(req.url);
});
*/
