/**
 * Image Upload Service
 * 
 * An abstraction layer for handling image uploads.
 * Currently uses Base64 encoding as a fallback, but is structured to be easily
 * swapped out for Supabase Storage, AWS S3, or Cloudinary in the future.
 */

export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export class ImageUploadService {
  /**
   * Uploads an image file and returns its public URL.
   * 
   * FUTURE: Replace the Base64 fallback with a real storage provider upload.
   */
  static async uploadImage(file: File): Promise<ImageUploadResponse> {
    try {
      // TODO: Implement Supabase Storage or Cloudinary upload here.
      // Example:
      // const path = `journals/${Date.now()}_${file.name}`;
      // const { data, error } = await supabase.storage.from('journal-images').upload(path, file);
      // if (error) throw error;
      // const url = supabase.storage.from('journal-images').getPublicUrl(path).data.publicUrl;
      // return { success: true, url };

      // TEMPORARY FALLBACK: Convert to Base64
      const base64Url = await this.fileToBase64(file);
      return { success: true, url: base64Url as string };
    } catch (error: any) {
      console.error("Image upload failed:", error);
      return { success: false, error: error.message || "Failed to upload image" };
    }
  }

  private static fileToBase64(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
}
