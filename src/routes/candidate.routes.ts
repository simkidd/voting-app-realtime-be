import { Router } from "express";
import {
  createCandidate,
  getCandidates,
  getCandidateById,
  deleteCandidate,
} from "../controllers/candidate.controller";
import { authenticate, adminOnly } from "../middlewares/auth.middleware";
import { uploadMiddleware } from "../utils/cloudinary";

const router = Router();

// Admin-only routes
router.post(
  "/create",
  authenticate,
  adminOnly,
  uploadMiddleware.single("photo"),
  createCandidate
);
router.delete("/:candidateId/delete", authenticate, adminOnly, deleteCandidate);

// Public routes
router.get("/", getCandidates);
router.get("/:candidateId", getCandidateById);

export default router;
