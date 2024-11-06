const dotenv = require("dotenv");

const express = require("express");
const Queue = require("bull");
const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const jobProcess = require("./disconnectProcess");

dotenv.config();

const app = express();

const PORT = parseInt(process.env.PORT);
const CONCURRENT_LIMIT = parseInt(process.env.CONCURRENT_LIMIT);
const ATTEMPTS = parseInt(process.env.ATTEMPTS);

const dataQueue = new Queue("disconnect-radius-client", {
  redis: { port: 6379, host: "127.0.0.1" },
});

app.use(express.json());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullAdapter(dataQueue)],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.post("/add-job", async (req, res) => {
  const { data } = req.body;

  try {
    await dataQueue.add(
      { data },
      {
        attempts: ATTEMPTS,
        backoff: {
          type: "exponential",
        },
      }
    );
    res.status(200).send("Job added to the queue");
  } catch (err) {
    res.status(500).send("Error adding job to the queue");
  }
});

dataQueue.process(CONCURRENT_LIMIT, jobProcess);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Bull Board running on http://localhost:${PORT}/admin/queues`);
});
