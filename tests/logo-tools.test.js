import test from 'node:test';
import assert from 'node:assert/strict';
import { getLogoPlacement, drawLogo } from '../src/lib/logoTools.js';

test('a wide logo fits a square output without cropping or stretching', () => {
  assert.deepEqual(getLogoPlacement(400, 100, 512, 512, 0), { x: 0, y: 192, width: 512, height: 128 });
  assert.deepEqual(getLogoPlacement(100, 400, 512, 512, 0), { x: 192, y: 0, width: 128, height: 512 });
});

test('padding is equal on both sides and works for small or rectangular outputs', () => {
  assert.deepEqual(getLogoPlacement(100, 100, 32, 32, 25), { x: 8, y: 8, width: 16, height: 16 });
  const result = getLogoPlacement(400, 100, 600, 240, 10);
  assert.equal(result.x, 24);
  assert.equal(result.width / result.height, 4);
  assert.equal(result.y * 2 + result.height, 240);
});

test('invalid or excessive dimensions and padding are rejected', () => {
  for (const args of [[100, 100, 0, 512], [100, 100, 5000, 5000], [0, 100, 32, 32], [100, 100, 32, 32, 50]]) {
    assert.throws(() => getLogoPlacement(...args));
  }
});

test('PNG canvas uses exact output dimensions and fills only an explicit background', () => {
  const fills = [], draws = [];
  const ctx = { fillRect: (...args) => fills.push(args), drawImage: (...args) => draws.push(args) };
  const canvas = { getContext: () => ctx };
  const image = { naturalWidth: 400, naturalHeight: 100 };
  drawLogo(canvas, image, 256, 256, 0, 'transparent');
  assert.equal(canvas.width, 256);
  assert.equal(canvas.height, 256);
  assert.equal(fills.length, 0);
  assert.deepEqual(draws[0].slice(1), [0, 96, 256, 64]);
  drawLogo(canvas, image, 64, 64, 0, '#ffffff');
  assert.deepEqual(fills, [[0, 0, 64, 64]]);
  assert.equal(ctx.fillStyle, '#ffffff');
});
