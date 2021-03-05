const auth = require("../middlewares/auth");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();

router.get("/", auth, async (req, res) => {
  const users = await User.find({}).lean();

  res.send({ users: users });
});

module.exports = router;
