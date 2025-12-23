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
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const createApp = async () => {
  await connectDatabase();
  const services = await initServices();
  const controllers = initControllers(services);
  const app = express();
  // Stripe webhook requires raw body for signature verification; mount it first
  app.post(
    "/api/v1/stripe/webhook",
    express.raw({ type: "application/json" }) as any,
    // Defer to router handler registered later; this preserves raw body
    (req, res, next) => next()
  );
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
  // expose services for route-level access (e.g., in me routes)
  app.set("services", services);

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
      path.resolve(process.cwd(), "openapi.json"),
      path.resolve(process.cwd(), "server/openapi.json"),
      path.resolve(__dirname, "../openapi.json"),
    ];
    const existing = candidates.find((p) => fs.existsSync(p));
    if (!existing) {
      indexLogger.error(
        "OpenAPI file not found. Checked: " + candidates.join(", ")
      );
    } else {
      const openapiJson = JSON.parse(fs.readFileSync(existing, "utf-8"));
      const setup = swaggerUi.setup(openapiJson);
      app.use("/api-docs", swaggerUi.serve, setup);

      indexLogger.info(
        `Swagger UI available at /api-docs and /api/v1/api-docs (spec: ${existing})`
      );
    }
  } catch (e) {
    indexLogger.error("Failed to load OpenAPI document for Swagger UI", e);
  }
  app.use("/api/v1/health", verifyToken, addUserContext, (req, res) => {
    res.json({
      status: "OK",
    });
  });
  const port = 52345;
  app.listen(port, "0.0.0.0", () => {
    indexLogger.info(`Server is running on http://localhost:${port}`);
    indexLogger.error(new ApiError("Test error logging", 500));
    indexLogger.warn("test", {
      testKey: "testValue",
    });
  });
};

createApp();
