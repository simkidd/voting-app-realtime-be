"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vote_controller_1 = require("../controllers/vote.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Cast vote
router.post("/cast", auth_middleware_1.authenticate, vote_controller_1.castVote);
// Get results
router.get("/:positionId/results", vote_controller_1.getResults);
exports.default = router;
