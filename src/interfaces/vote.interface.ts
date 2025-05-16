import { Document, Types } from "mongoose";

export interface IVote extends Document {
  userId: Types.ObjectId;
  positionId: Types.ObjectId;
  candidateId: Types.ObjectId;
  electionId: Types.ObjectId;
  votedAt: Date;
}
