import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// For local development, we store in public/uploads/attachments
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "attachments");

export class StorageService {
  /**
   * Initializes the storage directory if it doesn't exist
   */
  private static async init() {
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Generates a safe, unique filename
   */
  public static generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const uuid = crypto.randomUUID();
    return `${uuid}${ext}`;
  }

  /**
   * Saves a buffer to storage
   */
  public static async save(buffer: Buffer, filename: string): Promise<string> {
    await this.init();
    const safeFilename = this.generateFilename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);
    
    await fs.writeFile(filePath, buffer);
    
    // Return relative path for DB storage
    return `/uploads/attachments/${safeFilename}`;
  }

  /**
   * Deletes a file from storage
   */
  public static async delete(storagePath: string): Promise<void> {
    try {
      // storagePath looks like "/uploads/attachments/uuid.ext"
      // We need to resolve it locally
      const relativePath = storagePath.replace(/^\//, ""); // remove leading slash
      const absolutePath = path.join(process.cwd(), "public", relativePath);
      
      await fs.unlink(absolutePath);
    } catch (error) {
      console.error(`Failed to delete file at ${storagePath}:`, error);
    }
  }

  /**
   * Gets the public URL for a file
   */
  public static getUrl(storagePath: string): string {
    // For local storage, the storagePath itself is the public URL
    // In production with S3, this would return the pre-signed URL or CDN link
    return storagePath;
  }
}
