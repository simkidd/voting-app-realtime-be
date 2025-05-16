"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const election_routes_1 = __importDefault(require("./election.routes"));
const position_routes_1 = __importDefault(require("./position.routes"));
const candidate_routes_1 = __importDefault(require("./candidate.routes"));
const vote_routes_1 = __importDefault(require("./vote.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/elections", election_routes_1.default);
router.use("/positions", position_routes_1.default);
router.use("/candidates", candidate_routes_1.default);
router.use("/votes", vote_routes_1.default);
exports.default = router;
