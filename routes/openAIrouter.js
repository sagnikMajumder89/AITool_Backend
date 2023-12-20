const express = require("express");
const isAuthenticated = require("../middleware/isAuthenticated");
const checkAPIReqLimit = require("../middleware/checkAPIReqLimit");
const openaiController = require("../controllers/openAIController");
const openaiRouter = express.Router();

openaiRouter.post(
  "/generate",
  isAuthenticated,
  checkAPIReqLimit,
  openaiController
);

module.exports = openaiRouter;
