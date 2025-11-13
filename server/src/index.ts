import express from "express";
import { connectDatabase } from "@/db/MongoDB.js";
import { initServices, initControllers, initRoutes } from "./init/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { addUserContext } from "./middleware/AddUserContext.js";
import { verifyToken } from "./middleware/VerifyToken.js";
import { config } from "@/config/index.js";
import { getChildLogger } from "@/logger/Logger.js";
import ApiError from "./utils/ApiError.js";
const indexLogger = getChildLogger("index");

const createApp = async () => {
  await connectDatabase();
  const services = await initServices();
  const controllers = initControllers(services);
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: config.ORIGIN,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      allowedHeaders: ["Content-Type", "Authorization", "x-team-id"],
      credentials: true,
    })
  );
  const routes = initRoutes(controllers, app);
  app.use("/api/v1/health", verifyToken, addUserContext, (req, res) => {
    res.json({
      status: "OK",
    });
  });

  const port = 52345;
  app.listen(port, () => {
    indexLogger.info(`Server is running on http://localhost:${port}`);
    indexLogger.error(new ApiError("Test error logging", 500));
  });
};

createApp();
