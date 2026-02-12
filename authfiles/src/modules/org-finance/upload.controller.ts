import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middlewares/index.js';
import { s3Service } from '../../libs/s3.js';
import { v4 as uuidv4 } from 'uuid';

export class UploadController {
    async uploadEvidence(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            if (!req.file) throw new Error('No file uploaded');
            
            const fileExtension = req.file.originalname.split('.').pop();
            const key = `finance/${req.organizationId}/${uuidv4()}.${fileExtension}`;
            
            // Use your s3.ts helper
            const result = await s3Service.uploadFile(
                key, 
                req.file.buffer, 
                req.file.mimetype
            );

            res.status(201).json({
                success: true,
                data: {
                    fileKey: result.key,
                    fileName: req.file.originalname,
                    fileType: req.file.mimetype,
                    fileSize: req.file.size,
                    url: result.url // Optional: for immediate preview
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

export const uploadController = new UploadController();