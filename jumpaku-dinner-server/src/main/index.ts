import express, { IRoute, IRouter } from "express";
import { v2Router } from "./router/v2";
import { initialize as initDB } from "./init";

const main = async () => {
  await initDB({
    host: "test-db",
    port: 5432,
    user: "postgres_user",
    password: "postgres_password",
    database: "postgres_database",
  });
  let app = express();
  const port = 3000;

  app.get("/", (req, res) => {
    res.send("Jumpaku Dinner!");
  });

  app.use("/v2", v2Router());

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
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
