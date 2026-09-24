import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const frontendDir = path.resolve(import.meta.dirname, "../../finpro/dist/public");
const frontendIndex = path.join(frontendDir, "index.html");

if (existsSync(frontendIndex)) {
  app.use(express.static(frontendDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(frontendIndex);
  });
} else {
  logger.warn({ frontendDir }, "FinPRO frontend build not found; API-only mode");
}

export default app;
