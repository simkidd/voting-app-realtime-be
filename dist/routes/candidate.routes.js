"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const candidate_controller_1 = require("../controllers/candidate.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const cloudinary_1 = require("../utils/cloudinary");
const router = (0, express_1.Router)();
// Admin-only routes
router.post("/create", auth_middleware_1.authenticate, auth_middleware_1.adminOnly, cloudinary_1.uploadMiddleware.single("photo"), candidate_controller_1.createCandidate);
router.delete("/:candidateId/delete", auth_middleware_1.authenticate, auth_middleware_1.adminOnly, candidate_controller_1.deleteCandidate);
// Public routes
router.get("/", candidate_controller_1.getCandidates);
router.get("/:candidateId", candidate_controller_1.getCandidateById);
exports.default = router;
