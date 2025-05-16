import { Router } from "express";
import {
  createPosition,
  togglePositionStatus,
  getPositions,
  deletePosition,
} from "../controllers/position.controller";
import { authenticate, adminOnly } from "../middlewares/auth.middleware";

const router = Router();

// Admin-only routes
router.post("/", authenticate, adminOnly, createPosition);
router.patch(
  "/:positionId/status",
  authenticate,
  adminOnly,
  togglePositionStatus
);
router.delete("/:positionId/delete", authenticate, adminOnly, deletePosition);

// Public routes
router.get("/", getPositions);

export default router;
