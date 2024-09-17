import express from "express";
import cors from "cors";
import connection from "./config/database.js";
import router from "./routes/index.js";

const app = express();

const startServer = async (port) => {
  // Connect to the database
  await connection();

  // Configure CORS
  const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
  };

  // CORS middleware
  app.use(cors(corsOptions));

  // Configure request body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Router middleware
  app.use("/v1/api", router);

  // 404 error handling middleware
  app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
  });

  // Global error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error to the console (or log it to a file)

    // If the environment is 'development', send detailed error information
    if (app.get("env") === "development") {
      return res.status(err.status || 500).json({
        error: {
          message: err.message,
          stack: err.stack,
        },
      });
    }

    // If not in 'development' environment, send a generic error message
    return res.status(err.status || 500).json({
      error: {
        message: "Internal Server Error",
      },
    });
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

export default startServer;
