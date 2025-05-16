import { Router } from "express";
import {
  createElection,
  updateElectionStatus,
  getElectionById,
  listElections,
  deleteElection,
} from "../controllers/election.controller";
import { adminOnly, authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Admin-only routes
router.post("/create", authenticate, adminOnly, createElection);
router.patch(
  "/:electionId/status",
  authenticate,
  adminOnly,
  updateElectionStatus
);
router.delete("/:electionId/delete", authenticate, adminOnly, deleteElection);

// Public routes
router.get("/", listElections);
router.get("/:electionId", getElectionById);

export default router;
