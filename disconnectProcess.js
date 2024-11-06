const { exec } = require("child_process");
const util = require("util");

const execPromisify = util.promisify(exec);

const jobProcess = async (job) => {
  try {
    const { username, ip, secret } = job.data;

    const command = `echo "User-Name=${username}" | radclient ${ip}:3799 "disconnect" ${secret}`;

    const response = await execPromisify(command);

    return response;
  } catch (error) {
    const errorDetails = {
      code: error.code,
      cmd: error.cmd,
      stdout: error.stdout,
      stderr: error.stderr,
    };

    throw new Error(JSON.stringify(errorDetails));
  }
};

module.exports = jobProcess;
