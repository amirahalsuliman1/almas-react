import { describe, it, expect } from 'vitest';
import { hoverLookFrom } from '../../app/lib/hoverLook';

describe('hoverLookFrom', () => {
  it("takes the first photo that is not the card's own and not a video", () => {
    const look = hoverLookFrom(
      {
        images: [
          { url: 'https://cdn.test/main.jpg' },
          { url: 'https://cdn.test/clip.jpg', type: 'video' },
          { url: 'https://cdn.test/yt.jpg', video_url: 'https://youtu.be/x' },
          { url: 'https://cdn.test/second.jpg' },
        ],
      },
      'https://cdn.test/main.jpg'
    );
    expect(look.second).toBe('https://cdn.test/second.jpg');
  });

  it('keeps only colours with a hex and a photo URL (the API may put the hex in image)', () => {
    const look = hoverLookFrom({
      options: [
        { type: 'radio', details: [{ name: 'S', color: '#000', image: 'https://cdn.test/s.jpg' }] },
        {
          type: 'color',
          details: [
            { name: 'أحمر', color: '#c00', image: 'https://cdn.test/red.jpg' },
            { name: 'أزرق', color: '#00c', image: '#00c' },
            { name: 'شر', color: 'red;background:url(x)', image: 'https://cdn.test/x.jpg' },
          ],
        },
      ],
    });
    expect(look.swatches).toEqual([{ name: 'أحمر', color: '#c00', image: 'https://cdn.test/red.jpg' }]);
  });

  it('is empty for a product with one photo and no colours, or no details', () => {
    expect(hoverLookFrom({ images: [{ url: 'https://cdn.test/a.jpg' }] }, 'https://cdn.test/a.jpg')).toEqual({
      second: null,
      swatches: [],
    });
    expect(hoverLookFrom(null)).toEqual({ second: null, swatches: [] });
  });
});
