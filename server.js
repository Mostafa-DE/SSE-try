import express from "express";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "redis";
import { questions } from "./seeds/index.js";

const app = express();
const PORT = 3000;
const redisClient = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

app.use(express.json());

const SSEClients = {};

app.get("/events", async (req, res) => {
  let clientId = req.query.clientId;
  if (!clientId) clientId = uuidv4();

  // Set headers to keep the connection open
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  await redisClient.set(
    clientId,
    JSON.stringify({ connected: true, lastUpdated: Date.now() })
  );
  SSEClients[clientId] = res;

  res.write(`data: {"clientId": "${clientId}"}\n\n`);

  req.on("close", async () => {
    delete SSEClients[clientId];
    await redisClient.set(
      clientId,
      JSON.stringify({
        connected: false,
        lastUpdated: Date.now(),
      })
    );
  });
});

app.post("/answer", async (req, res) => {
  const { clientId, answer } = req.body;

  const result = answer === "1" ? "Correct!" : "Wrong answer.";

  const client = await redisClient.get(clientId);
  try {
    const { connected, lastUpdated } = JSON.parse(client);
    if (connected) {
      SSEClients[clientId].write(
        `data: {"message": "${result}", "lastUpdated": "${lastUpdated}"}\n\n`
      );
    }
  } catch (error) {
    console.log(error);
  }

  res.json({ message: "Answer received" });
});

app.get("/questions", (_, res) => {
  res.json({ questions: questions });
});

app.use(express.static("public"));

app.listen(PORT, () =>
  console.log("Listen on PORT 3000 ==> http://localhost:3000")
);
