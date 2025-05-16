import express from "express";
import cors from "cors";
import { env } from "./utils/environments";
import router from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

const prodOrigins = [
  "http://localhost:3000",
  "https://voting-app-realtime-fe.vercel.app",
];
const devOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];

const { NODE_ENV } = env;

let origin: string[] | boolean;

if (NODE_ENV === "production") {
  origin = prodOrigins;
} else if (NODE_ENV === "development") {
  origin = [...prodOrigins, ...devOrigins];
} else {
  origin = true;
}

const app = express();

app.use(
  cors({
    origin,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// import routes
app.use("/api/v1", router);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Handle 404
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
