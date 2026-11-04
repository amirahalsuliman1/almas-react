import { describe, it, expect } from 'vitest';
import { safeVideoUrl, toEmbed } from '../../app/lib/videoEmbed';

describe('toEmbed', () => {
  it.each([
    ['https://www.youtube.com/watch?v=abc123', 'https://www.youtube.com/embed/abc123?playsinline=1'],
    ['https://youtu.be/abc123', 'https://www.youtube.com/embed/abc123?playsinline=1'],
    ['https://youtube.com/shorts/abc123', 'https://www.youtube.com/embed/abc123?playsinline=1'],
    ['https://www.tiktok.com/@am1als/video/7312345678901234567', 'https://www.tiktok.com/embed/v2/7312345678901234567'],
    ['https://www.instagram.com/reel/Cx1Ab2/', 'https://www.instagram.com/reel/Cx1Ab2/embed'],
  ])('%s → %s', (url, embed) => {
    expect(toEmbed(url)).toBe(embed);
  });

  it('leaves a direct file for <video>', () => {
    expect(toEmbed('https://cdn.salla.sa/clip.mp4')).toBeNull();
  });
});

describe('safeVideoUrl', () => {
  it('keeps http(s) links only', () => {
    expect(safeVideoUrl(' https://youtu.be/x ')).toBe('https://youtu.be/x');
    expect(safeVideoUrl('javascript:alert(1)')).toBeNull();
    expect(safeVideoUrl('')).toBeNull();
    expect(safeVideoUrl(null)).toBeNull();
  });
});
