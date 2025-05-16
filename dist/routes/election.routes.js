"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const election_controller_1 = require("../controllers/election.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Admin-only routes
router.post("/create", auth_middleware_1.authenticate, auth_middleware_1.adminOnly, election_controller_1.createElection);
router.patch("/:electionId/status", auth_middleware_1.authenticate, auth_middleware_1.adminOnly, election_controller_1.updateElectionStatus);
router.delete("/:electionId/delete", auth_middleware_1.authenticate, auth_middleware_1.adminOnly, election_controller_1.deleteElection);
// Public routes
router.get("/", election_controller_1.listElections);
router.get("/:electionId", election_controller_1.getElectionById);
exports.default = router;
