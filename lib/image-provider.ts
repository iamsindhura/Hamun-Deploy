import { createApi } from 'unsplash-js';

export interface ImageProvider {
  searchImages(query: string, count: number): Promise<string[]>;
}

export class UnsplashProvider implements ImageProvider {
  private unsplash: ReturnType<typeof createApi> | null = null;

  constructor() {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (accessKey) {
      this.unsplash = createApi({
        accessKey: accessKey,
        fetch: fetch,
      });
    }
  }

  async searchImages(query: string, count: number = 3): Promise<string[]> {
    if (!this.unsplash) {
      console.warn("Unsplash API Key missing. Returning placeholder images.");
      // Fallback for development if API key is not yet set
      return Array.from({ length: count }).map((_, i) => 
        `https://images.unsplash.com/photo-1506744626753-1fa28f67ea66?q=80&w=1000&auto=format&fit=crop&random=${Date.now() + i}`
      );
    }

    try {
      const result = await (this.unsplash as any).search.getPhotos({
        query: query,
        perPage: count,
        orientation: 'landscape',
      });

      if (result.errors) {
        console.error("Unsplash Error:", result.errors);
        return [];
      }

      return result.response?.results.map((photo: any) => photo.urls.regular) || [];
    } catch (e) {
      console.error("Failed to fetch from Unsplash", e);
      return [];
    }
  }
}

// Export a singleton instance of the default provider
export const imageProvider: ImageProvider = new UnsplashProvider();
