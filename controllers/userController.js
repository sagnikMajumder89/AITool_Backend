const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//*---------Registration---------

const register = asyncHandler(async (req, res) => {
  try {
    const { username, email, password } = req.body;
    //Validate
    if (!username || !email || !password) {
      res.status(400);
      throw new Error("Please fill in all fields");
    }
    //Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }
    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    newUser.trialExpires =
      Date.now() + newUser.trialPeriod * 24 * 60 * 60 * 1000;

    //Save user
    await newUser.save();
    res.json({
      status: true,
      message: "Registration was successful!",
      user: {
        username,
        email,
      },
    });
  } catch (error) {
    throw new Error(error);
  }
});

//*---------Login---------

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  //Validate
  if (!email || !password) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }
  //Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("User does not exist");
  }
  //Check if password is correct
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  //Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  //Set token into cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  //Send response
  res.json({
    status: "success",
    message: "Login successful!",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

//*---------Logout---------

const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", { maxAge: 1 });
  res.status(200).json({
    message: "Logout successful!",
  });
});
//*---------Profile---------
const userProfile = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const user = await User.findById(id)
    .select("-password")
    .populate("payments")
    .populate("history");
  if (user) {
    res.status(200).json({
      status: "success",
      user,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
//*---------Check user auth status---------
const checkAuth = asyncHandler(async (req, res) => {
  if (!req.cookies.token) return res.json(false);
  const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
  if (decoded) {
    res.json(true);
  } else {
    res.json(false);
  }
});
module.exports = {
  register,
  login,
  logout,
  userProfile,
  checkAuth,
};
