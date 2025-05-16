import { Document, Types } from "mongoose";

export interface IPosition extends Document {
  title: string;
  description: string;
  electionId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}
