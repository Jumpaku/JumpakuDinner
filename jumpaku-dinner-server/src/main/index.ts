import express from "express";
import { v2Router } from "./api/routing/v2";
import { createAppState } from "./state/AppState";

const main = async () => {
  const { config, state } = (
    await createAppState({
      url: "https://localhost",
      database: {
        name: "postgres_database",
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
  const port = 3000;

  server.get("/", (req, res) => {
    res.send("Jumpaku Dinner!");
  });

  server.use("/v2", v2Router(state));

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
