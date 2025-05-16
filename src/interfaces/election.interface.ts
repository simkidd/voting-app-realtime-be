import { Types, Document } from "mongoose";

export enum ElectionStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  COMPLETED = "completed",
  DRAFT = "draft",
  CANCELLED = "cancelled",
}

export interface IElection extends Document {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: ElectionStatus;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
