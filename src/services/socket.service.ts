import { getIO } from '../config/socket';
import { Candidate } from '../models/candidate.schema';

export const broadcastResults = async (positionId: string) => {
  try {
    const results = await Candidate.find({ positionId })
      .sort({ votes: -1 })
      .lean();

    getIO().to(`position-${positionId}`).emit('vote-update', {
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Broadcast error:', error);
  }
};