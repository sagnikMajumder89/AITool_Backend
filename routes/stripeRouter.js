const express = require("express");
const isAuthenticated = require("../middleware/isAuthenticated");
const stripeRouter = express.Router();
const {
  handleStripePayment,
  handleFreeSubscription,
  verifyPayment,
} = require("../controllers/stripeController");

stripeRouter.post("/checkout", isAuthenticated, handleStripePayment);
stripeRouter.post("/free-plan", isAuthenticated, handleFreeSubscription);
stripeRouter.post("/verify-payment/:paymentId", isAuthenticated, verifyPayment);

module.exports = stripeRouter;
