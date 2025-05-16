import { Router } from "express";
import { login, getMe, logout } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me (protected)
router.get("/me", authenticate, getMe);

// POST /api/auth/logout
router.post("/logout", authenticate, logout);

export default router;
