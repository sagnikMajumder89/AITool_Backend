const asyncHandler = require("express-async-handler");
const calculateNextBillingDate = require("../utils/calculateNextBillingDate");
const shouldRenewSubscription = require("../utils/shouldRenewSubscription");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/Payment");
const User = require("../models/User");

//*---Stripe Payment----
const handleStripePayment = asyncHandler(async (req, res) => {
  const { amount, subscriptionPlan } = req.body;

  //get the user
  const user = req.user;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      currency: "inr",
      //add some data to the meta object
      metadata: {
        userId: user._id.toString(),
        userEmail: user.email,
        subscriptionPlan,
      },
    });

    //send response to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});
//*---Handle Free subscription----
const handleFreeSubscription = asyncHandler(async (req, res) => {
  //*---Get the logged in user----
  const user = req.user;
  try {
    //*---Check if renew is required or not----
    if (shouldRenewSubscription(user)) {
      //*---Update the user account----
      user.subscriptionPlan = "Free";
      user.monthlyRequestCount = 5;
      user.apiRequestCount = 0;
      //*---Calculate the next billing date----
      user.nextBillingDate = calculateNextBillingDate();
      //Save the user
      //*---Create new payment and save into DB----
      const newPayment = await new Payment({
        user: user._id,
        subscriptionPlan: "Free",
        amount: 0,
        status: "success",
        currency: "inr",
        monthlyRequestCount: 5,
        reference: Math.random().toString(36).substring(7),
      });
      user.payments.push(newPayment._id);
      await newPayment.save();
      await user.save();
      //*---Send the response to the client----
      return res.json({ message: "Free subscription renewed", user });
    } else {
      return res
        .status(403)
        .json({ message: "Subscription renewal not due yet" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

    if (paymentIntent.status === "succeeded") {
      //get info metadata
      const metadata = paymentIntent.metadata;
      const subscriptionPlan = metadata.subscriptionPlan;
      const userEmail = metadata.userEmail;
      const userId = metadata.userId;

      //find the user
      const userFound = await User.findById(userId);
      if (!userFound) {
        return res.status(404).json({ message: "User not found" });
      }
      //get payment details
      const amount = paymentIntent.amount;
      const currency = paymentIntent.currency;
      //create Payment history
      const newPayment = new Payment({
        user: userId,
        subscriptionPlan,
        amount,
        status: "success",
        currency,
        reference: paymentIntent.id,
      });
      await newPayment.save();
      if (subscriptionPlan === "Basic") {
        userFound.subscriptionPlan = "Basic";
        userFound.monthlyRequestCount = 50;
        userFound.apiRequestCount = 0;
        userFound.nextBillingDate = calculateNextBillingDate();
        userFound.trialPeriod = 0;
        userFound.payments.push(newPayment._id);
        await userFound.save();
      }
      if (subscriptionPlan === "Premium") {
        userFound.subscriptionPlan = "Premium";
        userFound.monthlyRequestCount = 100;
        userFound.apiRequestCount = 0;
        userFound.nextBillingDate = calculateNextBillingDate();
        userFound.trialPeriod = 0;
        userFound.payments.push(newPayment._id);
        await userFound.save();
      }
      res.json({ message: "Payment success", user: userFound });
    } else {
      res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});
module.exports = { handleStripePayment, handleFreeSubscription, verifyPayment };
