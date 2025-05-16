import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "../utils/environments";
import { authenticateSocket } from "../middlewares/auth.middleware";

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

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(`User ${socket.data.id} connected`);

    socket.on("subscribe", (positionId: string) => {
      socket.join(`position-${positionId}`);
      console.log(`User subscribed to position ${positionId}`);
    });

    socket.on("unsubscribe", (positionId: string) => {
      socket.leave(`position-${positionId}`);
      console.log(`User unsubscribed from position ${positionId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`User ${socket.data.id} disconnected: ${reason}`);
    });

    socket.on("error", (err) => {
      console.error(`Socket error for user ${socket.data.id}:`, err);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
