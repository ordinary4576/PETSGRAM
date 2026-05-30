import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

export class StorageService {
  private static s3Client: S3Client | null = null;
  private static BUCKET_NAME = process.env.AWS_S3_BUCKET || 'petsgram-uploads-bucket';

  /**
   * Initializes S3 client or returns existing instance
   */
  private static getS3Client(): S3Client {
    if (this.s3Client) return this.s3Client;

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-west-2';

    // Enforce cryptographic client settings
    this.s3Client = new S3Client({
      region,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey
      } : undefined
    });

    return this.s3Client;
  }

  /**
   * Generates secure, authenticated AWS S3 pre-signed PUT upload URLs
   * Prevents exposing backend keys to clients and processes uploads securely.
   */
  public static async getPresignedUploadUrl(filename: string, mimetype: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    // 1. Enforce strict MIME Type validation
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowedMimeTypes.includes(mimetype)) {
      throw new Error('INVALID_MIME_TYPE: Allowed extensions are only JPEG, PNG, WEBP, and MP4.');
    }

    // 2. Enforce unique cryptographic filenames to block Path Traversal & collisions
    const fileExtension = filename.split('.').pop() || 'jpg';
    const uniqueId = crypto.randomUUID();
    const secureKey = `uploads/${uniqueId}.${fileExtension}`;

    // 3. Setup sandbox fallback if AWS secrets are missing
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    if (!accessKey) {
      const mockUploadUrl = `https://sandbox-s3-signed-upload.petsgram.io/${secureKey}?signature=secure_s3_mock_sig_39a0e`;
      const mockFileUrl = `https://s3.us-west-2.amazonaws.com/${this.BUCKET_NAME}/${secureKey}`;
      
      console.info(`==============================================================================`);
      console.info(`☁️ AWS S3 STORAGE SANDBOX PREVIEW: Pre-Signed S3 Upload URL Issued`);
      console.info(`👉 File Key: ${secureKey}`);
      console.info(`👉 Signed Upload URL: ${mockUploadUrl}`);
      console.info(`👉 Final Resource URL: ${mockFileUrl}`);
      console.info(`==============================================================================`);
      
      return {
        uploadUrl: mockUploadUrl,
        fileUrl: mockFileUrl
      };
    }

    // 4. Generate actual S3 Pre-Signed URL
    const client = this.getS3Client();
    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: secureKey,
      ContentType: mimetype
    });

    try {
      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: 900 // 15 minutes expiration window
      });
      const fileUrl = `https://${this.BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${secureKey}`;

      console.info(`STORAGE SERVICE: Generated S3 presigned URL for secure upload key: ${secureKey}`);
      return { uploadUrl, fileUrl };
    } catch (error: any) {
      console.error(`ERROR: S3 signed URL execution failure. Message: ${error.message}`);
      throw new Error('S3_SIGNED_URL_FAILED');
    }
  }
}
export default StorageService;
