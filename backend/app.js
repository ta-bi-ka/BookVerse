

const express = require("express");
const session = require("express-session");
const genreRoutes = require("./routes/genreRoutes");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const authorRoutes = require("./routes/authorRoutes");
const fineRoutes = require("./routes/fineRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const bookshelfRoutes = require("./routes/bookshelfRoutes");
const publisherRoutes = require("./routes/publisherRoutes");
const bookCopyRoutes = require("./routes/bookCopyRoutes");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

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
      sameSite: "lax",
      secure: false,
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

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookshelves", bookshelfRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/publishers", publisherRoutes);
app.use("/api/genres", genreRoutes);
app.use("/api/fines", fineRoutes);
app.use("/api/book-copies", bookCopyRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/reservations", reservationRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;


