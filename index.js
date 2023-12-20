const express = require("express");
require("dotenv").config();
require("./utils/connectDB")();
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const cron = require("node-cron");
const userRouter = require("./routes/userRouter");
const openaiRouter = require("./routes/openAIrouter");
const stripeRouter = require("./routes/stripeRouter");
const { errorHandler } = require("./middleware/errorMiddleware");
const User = require("./models/User");
const port = process.env.PORT || 8000;

//*Cron for the trial period (every single day)
cron.schedule("0 0 * * * *", async () => {
  try {
    const today = new Date();
    await User.updateMany(
      {
        trialActive: true,
        trialExpires: { $lt: today },
      },
      {
        trialActive: false,
        // trialExpires: null,
        subscriptionPlan: "Free",
        monthlyRequestCount: 5,
      }
    );
  } catch (error) {
    console.log("Error in cron");
    console.log(error);
  }
});
//*Cron free plan
cron.schedule("0 0 1 * * *", async () => {
  try {
    const today = new Date();
    await User.updateMany(
      {
        subscriptionPlan: "Free",
        nextBillingDate: { $lt: today },
      },
      {
        monthlyRequestCount: 0,
      }
    );
  } catch (error) {
    console.log("Error in cron");
    console.log(error);
  }
});
//*Cron Basic Plan
cron.schedule("0 0 1 * * *", async () => {
  try {
    const today = new Date();
    await User.updateMany(
      {
        subscriptionPlan: "Basic",
        nextBillingDate: { $lt: today },
      },
      {
        monthlyRequestCount: 0,
      }
    );
  } catch (error) {
    console.log("Error in cron");
    console.log(error);
  }
});
//*Cron Premium Plan
cron.schedule("0 0 1 * * *", async () => {
  try {
    const today = new Date();
    await User.updateMany(
      {
        subscriptionPlan: "Premium",
        nextBillingDate: { $lt: today },
      },
      {
        monthlyRequestCount: 0,
      }
    );
  } catch (error) {
    console.log("Error in cron");
    console.log(error);
  }
});

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true, //access-control-allow-credentials:true
};
app.use(cors(corsOptions));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/openai", openaiRouter);
app.use("/api/v1/stripe", stripeRouter);

app.use(errorHandler);
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
