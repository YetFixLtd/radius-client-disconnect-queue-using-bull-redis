const dotenv = require("dotenv");

const express = require("express");
const { body, validationResult } = require("express-validator");

const Queue = require("bull");
const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");

const jobProcess = require("./disconnectProcess");

dotenv.config();

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT, 10);
const CONCURRENT_LIMIT = parseInt(process.env.CONCURRENT_LIMIT, 10);
const ATTEMPTS = parseInt(process.env.ATTEMPTS, 10);
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10);

const dataQueue = new Queue("disconnect-radius-client", {
  redis: { port: REDIS_PORT, host: REDIS_HOST },
});

app.use(express.json());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullAdapter(dataQueue)],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

const validationArr = [
  body("username").notEmpty().withMessage("Username is required"),
  body("username").isString().withMessage("Username must be a string"),

  body("ip").notEmpty().withMessage("IP address is required"),
  body("ip").isIP().withMessage("Invalid IP address format"),

  body("secret").notEmpty().withMessage("Secret is required"),
  body("secret").isString().withMessage("Secret must be a string"),
  body("isOnline").isBoolean().withMessage("isOnline must be a boolean."),
];

app.post("/add-disconnect-job", validationArr, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const data = req.body;

  try {
    await dataQueue.add(data, {
      attempts: ATTEMPTS,
      backoff: {
        type: "exponential",
      },
      priority: data.isOnline ? 1 : 3,
    });
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
