import { IUser } from "./user.interface";

// interfaces/ApiResponse.ts
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: IUser;
}

export interface VoteResponse {
  success: boolean;
  updatedResults: {
    candidateId: string;
    votes: number;
  }[];
}
