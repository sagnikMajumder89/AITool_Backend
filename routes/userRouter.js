const express = require("express");
const isAuthenticated = require("../middleware/isAuthenticated");
const userRouter = express.Router();
const {
  register,
  login,
  logout,
  userProfile,
  checkAuth,
} = require("../controllers/userController");

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/logout", logout);
userRouter.get("/profile", isAuthenticated, userProfile);
userRouter.get("/checkAuth", checkAuth);

module.exports = userRouter;
