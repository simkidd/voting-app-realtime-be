"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePosition = exports.getPositions = exports.togglePositionStatus = exports.createPosition = void 0;
const election_interface_1 = require("../interfaces/election.interface");
const election_schema_1 = require("../models/election.schema");
const position_schema_1 = require("../models/position.schema");
const createPosition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, description, electionId } = req.body;
        // 1. Input validation
        if (!title || !electionId) {
            res.status(400).json({
                success: false,
                error: "Title and election ID are required",
            });
            return;
        }
        // 2. Verify election exists and is editable
        const election = yield election_schema_1.Election.findById(electionId);
        if (!election || election.isDeleted) {
            res.status(404).json({
                success: false,
                error: "Election not found",
            });
            return;
        }
        if (election.status === election_interface_1.ElectionStatus.COMPLETED) {
            res.status(400).json({
                success: false,
                error: "Cannot add positions to completed elections",
            });
            return;
        }
        // 3. Check for duplicate position title in same election
        const existingPosition = yield position_schema_1.Position.findOne({
            title,
            electionId,
            isDeleted: false,
        });
        if (existingPosition) {
            res.status(409).json({
                success: false,
                error: "Position with this title already exists in the election",
            });
            return;
        }
        // 4. Create position
        const position = new position_schema_1.Position({
            title,
            description,
            electionId,
            isActive: false,
            createdBy: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        yield position.save();
        // 5. Return created position
        res.status(201).json({
            success: true,
            data: position,
        });
        return;
    }
    catch (error) {
        console.error("Create position error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create position",
        });
        return;
    }
});
exports.createPosition = createPosition;
const togglePositionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { positionId } = req.params;
        const { isActive } = req.body;
        // 1. Validate input
        if (typeof isActive !== "boolean") {
            res.status(400).json({
                success: false,
                error: "isActive must be a boolean value",
            });
            return;
        }
        // 2. Get position with election details
        const position = yield position_schema_1.Position.findById(positionId).populate({
            path: "electionId",
            select: "status startDate endDate",
        });
        if (!position || position.isDeleted) {
            res.status(404).json({
                success: false,
                error: "Position not found",
            });
            return;
        }
        const election = position.electionId;
        // 3. Validate election status
        if (election.status === election_interface_1.ElectionStatus.COMPLETED) {
            res.status(400).json({
                success: false,
                error: "Cannot modify positions in completed elections",
            });
            return;
        }
        // 4. Validate active period
        const now = new Date();
        if (isActive && (now < election.startDate || now > election.endDate)) {
            res.status(400).json({
                success: false,
                error: "Position can only be active during election period",
            });
            return;
        }
        // 5. Update position status
        const updatedPosition = yield position_schema_1.Position.findByIdAndUpdate(positionId, { isActive }, { new: true, runValidators: true });
        // 3. Return updated position
        res.status(200).json({
            success: true,
            data: updatedPosition,
        });
        return;
    }
    catch (error) {
        console.error("Toggle position error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update position",
        });
    }
});
exports.togglePositionStatus = togglePositionStatus;
const getPositions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { electionId, active } = req.query;
        // Build query
        const query = { isDeleted: false };
        if (electionId)
            query.electionId = electionId;
        if (active === "true")
            query.isActive = true;
        if (active === "false")
            query.isActive = false;
        const positions = yield position_schema_1.Position.find()
            .populate("electionId", "title status")
            .sort({ createdAt: 1 });
        res.status(200).json({
            success: true,
            data: positions,
        });
        return;
    }
    catch (error) {
        console.error("Get positions error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch positions",
        });
        return;
    }
});
exports.getPositions = getPositions;
const deletePosition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { positionId } = req.params;
        // 1. Check if position exists
        const position = yield position_schema_1.Position.findById(positionId);
        if (!position) {
            res.status(404).json({
                success: false,
                error: "Position not found",
            });
            return;
        }
        // 2. Prevent deletion of active positions
        if (position.isActive) {
            res.status(400).json({
                success: false,
                error: "Cannot delete active positions",
            });
            return;
        }
        // 3. Soft delete
        yield position_schema_1.Position.findByIdAndUpdate(positionId, { isDeleted: true }, { new: true });
        res.json({
            success: true,
            message: "Position deleted successfully",
        });
        return;
    }
    catch (error) {
        console.error("Delete position error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete position",
        });
        return;
    }
});
exports.deletePosition = deletePosition;
