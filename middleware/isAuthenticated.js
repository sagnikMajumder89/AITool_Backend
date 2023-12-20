const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const isAuthenticated = asyncHandler(async (req, res, next) => {
  if (req.cookies.token) {
    //! Verify token
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } else {
    return res.status(401).json({ message: "You are not authorized" });
  }
  next();
});

module.exports = isAuthenticated;
