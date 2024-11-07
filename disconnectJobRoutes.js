const { body, validationResult } = require("express-validator");
const dataQueue = require("./dataQueue");

exports.validationArr = [
  body("username").notEmpty().withMessage("Username is required"),
  body("username").isString().withMessage("Username must be a string"),

  body("ip").notEmpty().withMessage("IP address is required"),
  body("ip").isIP().withMessage("Invalid IP address format"),

  body("secret").notEmpty().withMessage("Secret is required"),
  body("secret").isString().withMessage("Secret must be a string"),
  body("isOnline").isBoolean().withMessage("isOnline must be a boolean."),
];

exports.disconnectJobRoute = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const data = req.body;

  try {
    await dataQueue.add(data, {
      priority: data.isOnline ? 1 : 3,
    });
    res.status(200).send("Job added to the queue");
  } catch (err) {
    res.status(500).send("Error adding job to the queue");
  }
};
