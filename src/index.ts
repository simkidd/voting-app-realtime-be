import http from "http";
import app from "./app";
import { initSocket } from "./config/socket";
import connectDB from "./config/db";
import { env } from "./utils/environments";

const { PORT } = env;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () =>
      console.log(`
        🚀 Server is running!
        🔗 http://localhost:${PORT}
        📡 Environment: ${env.NODE_ENV}
        🕒 ${new Date().toLocaleString()}
      `)
    );

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("💥 Process terminated");
        process.exit(0);
      });
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

startServer();
