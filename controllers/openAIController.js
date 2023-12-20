const asyncHandler = require("express-async-handler");
const axios = require("axios");
const ContentHistory = require("../models/ContentHistory");
const User = require("../models/User");

const openAIController = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { prompt } = req.body;
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/completions",
      {
        model: "gpt-3.5-turbo-instruct",
        prompt,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    const content = response.data.choices[0].text.trim();
    //*Create content history
    const contentHist = await ContentHistory.create({
      user: req.user._id,
      content,
    });
    //*Push the content to user history
    const userFound = await User.findById(req.user._id);
    userFound.history.push(contentHist._id);
    //*Update api request count
    userFound.apiRequestCount += 1;
    //*Save the user
    await userFound.save();
    //*Send content to client
    res.status(200).json(content);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = openAIController;
