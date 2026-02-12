import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/index.js';
import logger from './logger.js';

const s3Client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

export interface UploadResult {
    key: string;
    url: string;
}

/**
 * Upload a file buffer to S3
 */
export async function uploadFile(
    key: string,
    body: Buffer,
    contentType: string
): Promise<UploadResult> {
    const command = new PutObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3Client.send(command);

    logger.info(`File uploaded to S3: ${key}`);

    return {
        key,
        url: `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`,
    };
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600 // 1 hour default
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: key,
    });

    await s3Client.send(command);

    logger.info(`File deleted from S3: ${key}`);
}

/**
 * Generate S3 key for personal finance reports
 */
export function generateReportKey(
    userId: string,
    reportId: string,
    format: 'pdf' | 'xlsx'
): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `personal-finance/${userId}/reports/${timestamp}_${reportId}.${format}`;
}

export const s3Service = {
    uploadFile,
    getSignedDownloadUrl,
    deleteFile,
    generateReportKey,
};

export default s3Service;
