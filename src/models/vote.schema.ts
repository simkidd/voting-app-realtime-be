import { model, Schema } from "mongoose";
import { IVote } from "../interfaces/vote.interface";

const VoteSchema = new Schema<IVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    positionId: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    electionId: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    votedAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index to enforce one vote per user per position
VoteSchema.index({ userId: 1, positionId: 1 }, { unique: true });

export const Vote = model<IVote>("Vote", VoteSchema);
