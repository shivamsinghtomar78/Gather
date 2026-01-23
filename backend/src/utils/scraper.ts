import axios from 'axios';
import * as cheerio from 'cheerio';

interface Metadata {
    title?: string;
    description?: string;
    image?: string;
}

/**
 * Scrapes metadata from a given URL using Cheerio.
 * Focuses on OpenGraph tags for best quality data.
 */
export async function scrapeMetadata(url: string): Promise<Metadata> {
    try {
        console.log(`🌐 Scraping metadata for: ${url}`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000
        });

        const $ = cheerio.load(data);

        const metadata: Metadata = {
            title: $('meta[property="og:title"]').attr('content') || $('title').text(),
            description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
            image: $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content')
        };

        // Cleanup title
        if (metadata.title) {
            metadata.title = metadata.title.trim();
        }

        return metadata;
    } catch (error) {
        console.warn(`⚠️ Scraping failed for ${url}:`, error instanceof Error ? error.message : error);
        return {};
    }
}
