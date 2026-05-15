import { describe, expect, it } from 'vitest';
import {
  buildImageUrl,
  buildItemWithImageUrl,
  buildItemsWithImageUrl,
} from '../../utils/item-images.js';

const request = {
  headers: {
    host: '127.0.0.1:3000',
  },
  protocol: 'http',
};

describe('item image helpers', () => {
  it('builds absolute image url from relative path', () => {
    expect(buildImageUrl(request, '/50000/image.png')).toBe(
      'http://127.0.0.1:3000/50000/image.png'
    );
  });

  it('keeps full image url unchanged', () => {
    expect(buildImageUrl(request, 'https://cdn.example.com/image.png')).toBe(
      'https://cdn.example.com/image.png'
    );
  });

  it('adds urls to single item and item list', () => {
    expect(
      buildItemWithImageUrl(request, {
        id: 1,
        image: '/50000/image.png',
      })
    ).toEqual({
      id: 1,
      image: 'http://127.0.0.1:3000/50000/image.png',
    });

    expect(
      buildItemsWithImageUrl(request, [
        { id: 1, image: '/50000/image.png' },
        { id: 2, image: null },
      ])
    ).toEqual([
      { id: 1, image: 'http://127.0.0.1:3000/50000/image.png' },
      { id: 2, image: null },
    ]);
  });
});
