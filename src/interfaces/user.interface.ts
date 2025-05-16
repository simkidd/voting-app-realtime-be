import { Document, Types } from "mongoose";

export interface IUser extends Document {
  corporateId: string;
  name: string;
  email: string;
  pin: string;
  role: "voter" | "candidate" | "admin";
  department: string;
  hasVoted: boolean;
  createdAt: Date;
  votedPositions: Types.ObjectId[];
}
