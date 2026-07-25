const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/chat", async (req, res) => {

  try {

    const userMessage = req.body.message;

    const completion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a professional AI fitness trainer.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],

        model: "llama-3.3-70b-versatile",
      });

    res.json({
      reply:
        completion.choices[0].message.content,
    });

  } catch (error) {

    console.log(error);

    res.json({
      reply: "Groq AI error",
    });

  }

});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Groq server running on port ${PORT}`);
});