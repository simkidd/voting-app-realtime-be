import { Router } from "express";
import authRoutes from "./auth.routes";
import electionRoutes from "./election.routes";
import positionRoutes from "./position.routes";
import candidateRoutes from "./candidate.routes";
import voteRoutes from "./vote.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/elections", electionRoutes);
router.use("/positions", positionRoutes);
router.use("/candidates", candidateRoutes);
router.use("/votes", voteRoutes);

export default router;
