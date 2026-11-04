/**
 * A video link turned into a player: an embed URL for YouTube, TikTok and
 * Instagram, or null for a direct file (played by `<video>`).
 */
const EMBED_PATTERNS: [RegExp, (id: string) => string][] = [
  [/youtube\.com\/watch\?(?:.*&)?v=([\w-]+)/i, (id) => `https://www.youtube.com/embed/${id}?playsinline=1`],
  [/youtu\.be\/([\w-]+)/i, (id) => `https://www.youtube.com/embed/${id}?playsinline=1`],
  [/youtube\.com\/shorts\/([\w-]+)/i, (id) => `https://www.youtube.com/embed/${id}?playsinline=1`],
  [/tiktok\.com\/.*\/video\/(\d+)/i, (id) => `https://www.tiktok.com/embed/v2/${id}`],
  [/instagram\.com\/(?:reel|p|tv)\/([\w-]+)/i, (code) => `https://www.instagram.com/reel/${code}/embed`],
];

export function toEmbed(url: string): string | null {
  for (const [pattern, build] of EMBED_PATTERNS) {
    const match = url.match(pattern);
    if (match) return build(match[1]);
  }
  return null;
}

/** Only http(s) links reach a player. */
export function safeVideoUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const url = raw.trim();
  return /^https?:\/\/\S+$/i.test(url) ? url : null;
}
