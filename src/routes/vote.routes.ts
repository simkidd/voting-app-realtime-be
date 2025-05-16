import { Router } from "express";
import {
  castVote,
  getResults
} from "../controllers/vote.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Cast vote
router.post("/cast", authenticate, castVote);

// Get results
router.get("/:positionId/results", getResults);

export default router;
