// BookVerse Express application configuration will be added in the backend foundation step.
const express = require("express");
const session = require("express-session");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BookVerse API is running",
  });
});

module.exports = app;