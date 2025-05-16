"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const position_controller_1 = require("../controllers/position.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Admin-only routes
router.post("/", auth_middleware_1.authenticate, auth_middleware_1.adminOnly, position_controller_1.createPosition);
router.patch("/:positionId/status", auth_middleware_1.authenticate, auth_middleware_1.adminOnly, position_controller_1.togglePositionStatus);
router.delete("/:positionId/delete", auth_middleware_1.authenticate, auth_middleware_1.adminOnly, position_controller_1.deletePosition);
// Public routes
router.get("/", position_controller_1.getPositions);
exports.default = router;
