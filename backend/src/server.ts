import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";

// Controllers & Routes
import refresh from "./controllers/refresh.js";
import studentRoutes from "./routes/studentRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import verifyEmailRoutes from "./routes/emailVerifyRoutes.js";
import sessionRoute from "./routes/sessionRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import logoutRoute from "./routes/logoutRoute.js";
import chatRouter from "./routes/chatRoute.js";

// Configs & Middlewares
import { errorHandler } from "./middlewares/errorHandler.js";
// import { connectToCache } from "./config/redisConfig.js";
import { connectToDb } from "./config/mongodbConfig.js";

// Socket.IO integration
import { initSocket } from "./socket/socket.js";

// tRPC integration
import { createContext } from "./context.js";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers/appRouter.js";

const app = express();

// Middlewares
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ggecl-frontend.vercel.app",
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(compression());
app.use(express.json());
app.use(cookieParser());

// Routes setup
const ROUTE_PREFIX = "/api/v1";
app.use(`${ROUTE_PREFIX}/student`, studentRoutes);
app.use(`${ROUTE_PREFIX}/instructor`, instructorRoutes);
app.use(`${ROUTE_PREFIX}/admin`, adminRoutes);
app.use(`${ROUTE_PREFIX}`, verifyEmailRoutes);
app.use(`${ROUTE_PREFIX}/refresh`, refresh);
app.use(ROUTE_PREFIX, sessionRoute);
app.use(`${ROUTE_PREFIX}`, logoutRoute);
app.use(`${ROUTE_PREFIX}/chat`, chatRouter);

app.use(
  `${ROUTE_PREFIX}/trpc`,
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.use(`${ROUTE_PREFIX}/health-check`, (req, res) => {
  res.send("Server is running!");
});

app.use(errorHandler);

const server = http.createServer(app);

export async function init() {
  try {
    await connectToDb();
    initSocket(server);
    console.log("✅ Database connected.");
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

export default server;
