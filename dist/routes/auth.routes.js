"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post("/login", auth_controller_1.login);
// GET /api/auth/me (protected)
router.get("/me", auth_middleware_1.authenticate, auth_controller_1.getMe);
// POST /api/auth/logout
router.post("/logout", auth_middleware_1.authenticate, auth_controller_1.logout);
exports.default = router;
