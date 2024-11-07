const dotenv = require("dotenv");
dotenv.config();

const express = require("express");

const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");

const jobProcess = require("./disconnectProcess");
const dataQueue = require("./dataQueue");
const disconnectJobRoute = require("./disconnectJobRoutes");

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT, 10);
const CONCURRENT_LIMIT = parseInt(process.env.CONCURRENT_LIMIT, 10);

app.use(express.json());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullAdapter(dataQueue)],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.post(
  "/add-disconnect-job",
  disconnectJobRoute.validationArr,
  disconnectJobRoute.disconnectJobRoute
);

dataQueue.process(CONCURRENT_LIMIT, jobProcess);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Bull Board running on http://localhost:${PORT}/admin/queues`);
});
