import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { config } from '@/config/config';
import { s3Logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';
import { Readable } from 'stream';
import crypto from 'crypto';
import path from 'path';
import mime from 'mime-types';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
  storageClass?:
    | 'STANDARD'
    | 'REDUCED_REDUNDANCY'
    | 'STANDARD_IA'
    | 'ONEZONE_IA'
    | 'INTELLIGENT_TIERING'
    | 'GLACIER'
    | 'DEEP_ARCHIVE';
  specificS3Url?: string;
  ignoreIfExists?: boolean;
}

export interface FileInfo {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
  contentLength?: number;
}

export interface MultipartUpload {
  uploadId: string;
  key: string;
  parts: Array<{
    partNumber: number;
    etag: string;
  }>;
}

/**
 * AWS S3 Service for file storage and management
 */
export class S3Service {
  private static instance: S3Service;
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private cloudFrontDomain?: string;

  public constructor() {
    this.bucket = config.AWS_S3_BUCKET;
    this.region = config.AWS_REGION;
    this.cloudFrontDomain = config.AWS_CLOUDFRONT_DOMAIN;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
      maxAttempts: 5,
      retryMode: 'adaptive',
      requestHandler: {
        connectionTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
      },
    });
  }

  // Get singleton instance
  public static getInstance(): S3Service {
    if (!S3Service.instance) {
      S3Service.instance = new S3Service();
    }
    return S3Service.instance;
  }

  /**
   * Generate presigned URL for downloading a file
   */
  // public async generateDownloadUrl(
  //   key: string,
  //   options: PresignedUrlOptions = {}
  // ): Promise<string> {
  //   try {
  //     const expiresIn = options.expiresIn || 3600; // Default 1 hour

  //     const command = new GetObjectCommand({
  //       Bucket: this.bucket,
  //       Key: key,
  //       ResponseContentType: options.contentType,
  //       ResponseContentDisposition: options.contentLength ? `attachment` : undefined,
  //     });

  //     const url = await getSignedUrl(this.s3Client, command, { expiresIn });

  //     s3Logger.info('Generated download presigned URL', { key, expiresIn });
  //     return url;
  //   } catch (error) {
  //     s3Logger.error('Error generating download presigned URL', { key, error });
  //     throw ApiError.internalServerError('Failed to generate download URL');
  //   }
  // }

  /**
   * Generate a unique file key
   */
  private generateFileKey(originalName: string, developerId: string, category?: string): string {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

    const keyParts = [
      'developers',
      developerId,
      category || 'general',
      `${timestamp}_${randomId}_${sanitizedName}${extension}`,
    ];

    return keyParts.join('/');
  }

  /**
   * Upload file to S3
   */
  public async uploadFile(
    file: Buffer | Readable,
    originalName: string,
    developerId: string,
    options: UploadOptions = {}
  ): Promise<{ key: string; url: string; size: number; wasSkipped: boolean }> {
    try {
      const key = options.specificS3Url
        ? options.specificS3Url.replace(this.getBucketUrl(), '')
        : this.generateFileKey(originalName, developerId, options.metadata?.category);
      const ignoreIfExists = options.ignoreIfExists ?? true;
      if (ignoreIfExists && await this.fileExists(key)) {
        const info = await this.getFileInfo(key);
        s3Logger.info('File already exists, skipping upload', { key, originalName, developerId });
        return { key, url: this.getFileUrl(key), size: info.size, wasSkipped: true };
      }
      const contentType =
        options.contentType || mime.lookup(originalName) || 'application/octet-stream';

      const uploadParams = {
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: {
          originalName,
          developerId,
          uploadedAt: new Date().toISOString(),
          ...options.metadata,
        },
        ACL: options.acl || 'private',
        StorageClass: options.storageClass || 'STANDARD',
        ...(options.tags && {
          Tagging: Object.entries(options.tags)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&'),
        }),
      };

      // Retry logic for network issues
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const upload = new Upload({
            client: this.s3Client,
            params: uploadParams,
            queueSize: 4,
            partSize: 1024 * 1024 * 5, // 5MB
            leavePartsOnError: false,
          });

          upload.on('httpUploadProgress', (progress: any) => {
            s3Logger.debug('Upload progress', {
              key,
              loaded: progress.loaded,
              total: progress.total,
              percentage: progress.total
                ? Math.round((progress.loaded! / progress.total) * 100)
                : 0,
              attempt: retries + 1,
            });
          });

          const result = await upload.done();

          const url = this.getFileUrl(key);
          const size = Buffer.isBuffer(file) ? file.length : 0;

          s3Logger.info('File uploaded successfully', {
            key,
            size: Number(size), // Ensure size is a number for logging
            contentType,
            developerId,
            originalName,
            attempt: retries + 1,
          });

          return { key, url, size: Number(size), wasSkipped: false }; // Ensure returned size is a number
        } catch (uploadError) {
          retries++;
          const isNetworkError =
            uploadError instanceof Error &&
            (uploadError.message.includes('EAI_AGAIN') ||
              uploadError.message.includes('ENOTFOUND') ||
              uploadError.message.includes('ECONNRESET') ||
              uploadError.message.includes('timeout'));

          if (isNetworkError && retries < maxRetries) {
            s3Logger.warn(`S3 upload attempt ${retries} failed, retrying...`, {
              key,
              originalName,
              error: uploadError.message,
              remainingRetries: maxRetries - retries,
            });

            // Wait before retry (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
            continue;
          } else {
            // If it's not a network error or we've exhausted retries, throw the error
            throw uploadError;
          }
        }
      }

      // This should never be reached due to the retry loop above
      throw new Error('Upload failed after all retry attempts');
    } catch (error) {
      s3Logger.error('File upload failed', {
        originalName,
        developerId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        errorCode: (error as any)?.code,
        errorName: (error as any)?.name,
        statusCode: (error as any)?.statusCode,
      });

      // Pass through the actual error for better debugging
      if (error instanceof Error) {
        throw ApiError.s3Error(`S3 Upload failed: ${error.message}`);
      } else {
        throw ApiError.s3Error('Failed to upload file');
      }
    }
  }

  /**
   * Download file from S3
   */
  public async downloadFile(key: string): Promise<{ stream: Readable; metadata: FileInfo }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('No file content received');
      }

      const metadata: FileInfo = {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || '',
        metadata: response.Metadata,
      };

      s3Logger.info('File downloaded successfully', {
        key,
        size: metadata.size,
        contentType: metadata.contentType,
      });

      return {
        stream: response.Body as Readable,
        metadata,
      };
    } catch (error) {
      s3Logger.error('File download failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if ((error as any).name === 'NoSuchKey') {
        throw ApiError.notFound('File not found');
      }

      throw ApiError.s3Error('Failed to download file');
    }
  }

  /**
   * Delete file from S3
   */
  public async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      s3Logger.info('File deleted successfully', { key });
    } catch (error) {
      s3Logger.error('File deletion failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('Failed to delete file');
    }
  }

  /**
   * Get file metadata
   */
  public async getFileInfo(key: string): Promise<FileInfo> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag || '',
        metadata: response.Metadata,
      };
    } catch (error) {
      s3Logger.error('Get file info failed', {
        key,
        error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
      });

      if ((error as any).name === 'NotFound') {
        throw ApiError.notFound('File not found');
      }

      throw ApiError.s3Error('Failed to get file info');
    }
  }

  /**
   * Check if file exists
   */
  public async fileExists(key: string): Promise<boolean> {
    try {
      await this.getFileInfo(key);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  public async listFiles(
    prefix: string,
    maxKeys: number = 1000
  ): Promise<{ files: FileInfo[]; hasMore: boolean; nextToken?: string }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);

      const files: FileInfo[] = (response.Contents || []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size || 0,
        contentType: 'application/octet-stream', // Not available in list operation
        lastModified: obj.LastModified || new Date(),
        etag: obj.ETag || '',
      }));

      s3Logger.debug('Files listed successfully', {
        prefix,
        count: files.length,
        hasMore: response.IsTruncated || false,
      });

      return {
        files,
        hasMore: response.IsTruncated || false,
        nextToken: response.NextContinuationToken,
      };
    } catch (error) {
      s3Logger.error('List files failed', {
        prefix,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('Failed to list files');
    }
  }

  /**
   * Copy file within S3
   */
  public async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      });

      await this.s3Client.send(command);

      s3Logger.info('File copied successfully', {
        sourceKey,
        destinationKey,
      });
    } catch (error) {
      s3Logger.error('File copy failed', {
        sourceKey,
        destinationKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('Failed to copy file');
    }
  }

  /**
   * Generate presigned URL for file upload
   */
  public async generateUploadUrl(
    key: string,
    options: PresignedUrlOptions = {}
  ): Promise<{ url: string; fields?: Record<string, string> }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: options.contentType,
        ContentLength: options.contentLength,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: options.expiresIn || 3600, // 1 hour default
      });

      s3Logger.debug('Upload URL generated', {
        key,
        expiresIn: options.expiresIn || 3600,
      });

      return { url };
    } catch (error) {
      s3Logger.error('Generate upload URL failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate presigned URL for file download
   */
  public async generateDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      // First try to generate presigned URL
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      s3Logger.debug('Download URL generated', {
        key,
        expiresIn,
      });

      return url;
    } catch (error) {
      s3Logger.error('Generate download URL failed, falling back to public URL', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Fallback to public URL if presigned URL fails
      return this.getFileUrl(key);
    }
  }

  /**
   * Generate download URL with fallback to direct streaming
   */
  public async generateDownloadUrlWithFallback(key: string, expiresIn: number = 3600): Promise<{ url: string; isPresigned: boolean }> {
    try {
      // Always generate presigned URL since public access is restricted
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      s3Logger.debug('Presigned download URL generated successfully', {
        key,
        expiresIn,
      });
      
      return { url, isPresigned: true };
    } catch (error) {
      s3Logger.error('Generate presigned download URL failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw ApiError.s3Error('Failed to generate download URL');
    }
  }

  /**
   * Get public file URL (for public files or via CloudFront)
   */
  public getFileUrl(key: string): string {
    if (this.cloudFrontDomain) {
      return `https://${this.cloudFrontDomain}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Get the base URL of the S3 bucket
   */
  private getBucketUrl(): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/`;
  }

  /**
   * Initiate multipart upload
   */
  public async initiateMultipartUpload(
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Metadata: metadata,
      });

      const response = await this.s3Client.send(command);

      if (!response.UploadId) {
        throw new Error('No upload ID received');
      }

      s3Logger.info('Multipart upload initiated', {
        key,
        uploadId: response.UploadId,
      });

      return response.UploadId;
    } catch (error) {
      s3Logger.error('Initiate multipart upload failed', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('Failed to initiate multipart upload');
    }
  }

  /**
   * Upload part for multipart upload
   */
  public async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<string> {
    try {
      const command = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
      });

      const response = await this.s3Client.send(command);

      if (!response.ETag) {
        throw new Error('No ETag received');
      }

      s3Logger.debug('Part uploaded successfully', {
        key,
        uploadId,
        partNumber,
        etag: response.ETag,
      });

      return response.ETag;
    } catch (error) {
      s3Logger.error('Upload part failed', {
        key,
        uploadId,
        partNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('Failed to upload part');
    }
  }

  /**
   * Complete multipart upload
   */
  public async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ partNumber: number; etag: string }>
  ): Promise<void> {
    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
        },
      });

      await this.s3Client.send(command);

      s3Logger.info('Multipart upload completed', {
        key,
        uploadId,
        partCount: parts.length,
      });
    } catch (error) {
      s3Logger.error('Complete multipart upload failed', {
        key,
        uploadId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('Failed to complete multipart upload');
    }
  }

  /**
   * Abort multipart upload
   */
  public async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      });

      await this.s3Client.send(command);

      s3Logger.info('Multipart upload aborted', {
        key,
        uploadId,
      });
    } catch (error) {
      s3Logger.error('Abort multipart upload failed', {
        key,
        uploadId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('Failed to abort multipart upload');
    }
  }

  /**
   * Health check for S3 service
   */
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // Try to list objects with a small limit to test connectivity
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1,
      });

      await this.s3Client.send(command);

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      s3Logger.error('S3 health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.s3Error('S3 health check failed');
    }
  }
}

// Export singleton instance
export const s3Service = S3Service.getInstance();
export default s3Service;
