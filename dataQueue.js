const Queue = require("bull");

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10);

const JOB_CLEAR_TIMEOUT = parseInt(process.env.JOB_CLEAR_TIMEOUT);
const ATTEMPTS = parseInt(process.env.ATTEMPTS, 10);

const dataQueue = new Queue("disconnect-radius-client", {
  redis: { port: REDIS_PORT, host: REDIS_HOST },
  defaultJobOptions: {
    removeOnComplete: {
      age: JOB_CLEAR_TIMEOUT,
    },
    removeOnFail: {
      age: JOB_CLEAR_TIMEOUT,
    },
    attempts: ATTEMPTS,
    backoff: {
      type: "exponential",
    },
  },
});

module.exports = dataQueue;
