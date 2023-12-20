const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const checkAPIReqLimit = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  //*Find the user in DB
  const userFound = await User.findById(req.user._id);
  if (!userFound) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  let requestLimit = 0;
  requestLimit = userFound.monthlyRequestCount;

  //*Check if the user has exceeded the monthly request limit
  if (userFound.apiRequestCount >= requestLimit) {
    throw new Error(
      "Monthly request limit exceeded. Please upgrade your plan."
    );
  }
  next();
});

module.exports = checkAPIReqLimit;
