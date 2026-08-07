// BookVerse server startup logic will be added in the backend foundation step.
const app = require("./app");
const { testDatabaseConnection } = require("./config/db");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`BookVerse server running on port ${PORT}`);
  });
};

startServer();