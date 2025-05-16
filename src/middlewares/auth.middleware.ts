// middleware/auth.middleware.ts
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import { User } from "../models/user.schema";
import { env } from "../utils/environments";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      corporateId: string;
      role: string;
    };

    req.user = {
      id: decoded.userId,
      corporateId: decoded.corporateId,
      role: decoded.role as "admin" | "voter",
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
    return;
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({
      success: false,
      error: "Admin access required",
    });
    return;
  }
  next();
};

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new Error("Authentication error: No token provided");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      corporateId: string;
      role: string;
    };

    // Verify user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error("Authentication error: User not found");
    }

    // Attach user data to socket
    socket.data = {
      id: user._id,
      corporateId: user.corporateId,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("Socket authentication error:", err);
    next(new Error("Authentication failed"));
  }
};
