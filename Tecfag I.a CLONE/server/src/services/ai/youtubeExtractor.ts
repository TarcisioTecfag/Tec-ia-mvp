/**
 * YouTube Extractor - Utilitário para detectar e extrair links do YouTube
 */

export interface YouTubeLink {
    url: string;
    videoId: string;
}

/**
 * Regex para detectar links do YouTube em diversos formatos:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID&t=123
 * - http://www.youtube.com/embed/VIDEO_ID
 */
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?].*)?/gi;

/**
 * Extrai todos os links do YouTube de um array de chunks
 */
export function extractYouTubeLinks(chunks: { content: string }[]): YouTubeLink[] {
    const foundLinks = new Map<string, YouTubeLink>();

    for (const chunk of chunks) {
        const content = chunk.content || '';
        let match;

        // Reset regex lastIndex for global search
        YOUTUBE_REGEX.lastIndex = 0;

        while ((match = YOUTUBE_REGEX.exec(content)) !== null) {
            const videoId = match[1];
            if (videoId && !foundLinks.has(videoId)) {
                // Reconstruct clean URL
                const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
                foundLinks.set(videoId, {
                    url: cleanUrl,
                    videoId
                });
            }
        }
    }

    return Array.from(foundLinks.values());
}

/**
 * Verifica se uma string contém um link do YouTube
 */
export function containsYouTubeLink(text: string): boolean {
    YOUTUBE_REGEX.lastIndex = 0;
    return YOUTUBE_REGEX.test(text);
}

/**
 * Extrai o videoId de um link do YouTube
 */
export function extractVideoId(url: string): string | null {
    YOUTUBE_REGEX.lastIndex = 0;
    const match = YOUTUBE_REGEX.exec(url);
    return match ? match[1] : null;
}
