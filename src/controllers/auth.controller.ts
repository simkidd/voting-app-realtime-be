// controllers/auth.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../interfaces/ApiResponse";
import { User } from "../models/user.schema";
import { IUser } from "../interfaces/user.interface";
import { env } from "../utils/environments";

const { JWT_SECRET } = env;

export const login = async (
  req: Request,
  res: Response<ApiResponse<{ token: string; user: Partial<IUser> }>>
) => {
  try {
    const { corporateId, pin } = req.body;

    if (!corporateId || !pin) {
      res.status(400).json({
        success: false,
        error: "Corporate ID and PIN are required",
      });
      return;
    }

    // Verify corporate ID and PIN
    const user = await User.findOne({ corporateId, pin });
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid corporate ID or PIN",
      });
      return;
    }

    // 2. Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        corporateId: user.corporateId,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const userResponseData = {
      id: user._id,
      corporateId: user.corporateId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      hasVoted: user.hasVoted,
    };

    res.cookie("token", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: userResponseData,
      },
    });
    return;
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
    return;
  }
};

export const getMe = async (
  req: Request,
  res: Response<ApiResponse<Partial<IUser>>>
) => {
  try {
    const user = await User.findById(req.user?.id).select("-pin");
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
    return;
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
    return;
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({
    success: true,
    message: "Logout successful",
  });
  return;
};
