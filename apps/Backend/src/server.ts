import express, { type Express } from "express";
import http, { type Server as HttpServer } from "http";
import cors from "cors";
import router from "./routes/user.route";
import router1 from "./routes/room.route";

type ServerInstance = {
  app: Express;
  server: HttpServer;
};

export function createServer(): ServerInstance {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_, res) => {
    res.status(200).json({ status: "ok", service: "DevSync Backend" });
  });

  app.use("/api/v1/user", router);
  app.use("/api/v1/room", router1);

  const server = http.createServer(app);

  return { app, server };
}
