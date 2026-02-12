import { z } from 'zod';

export const updatePresenceSchema = z.object({
    status: z.enum(['AVAILABLE', 'WORKING', 'BUSY', 'IN_MEETING', 'ON_BREAK', 'AT_LUNCH', 'AWAY']),
});

export type UpdatePresenceInput = z.infer<typeof updatePresenceSchema>;

export type PresenceStatus = 'AVAILABLE' | 'WORKING' | 'BUSY' | 'IN_MEETING' | 'ON_BREAK' | 'AT_LUNCH' | 'AWAY' | 'OFFLINE';
