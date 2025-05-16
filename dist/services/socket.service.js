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
exports.broadcastResults = void 0;
const socket_1 = require("../config/socket");
const candidate_schema_1 = require("../models/candidate.schema");
const broadcastResults = (positionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield candidate_schema_1.Candidate.find({ positionId })
            .sort({ votes: -1 })
            .lean();
        (0, socket_1.getIO)().to(`position-${positionId}`).emit('vote-update', {
            success: true,
            data: results
        });
    }
    catch (error) {
        console.error('Broadcast error:', error);
    }
});
exports.broadcastResults = broadcastResults;
