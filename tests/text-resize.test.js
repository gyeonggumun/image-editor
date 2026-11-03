import test from 'node:test';
import assert from 'node:assert/strict';
import { resizeTextLayer } from '../src/lib/textResize.js';

const layer = { x: 100, y: 80, size: 20, textWidth: 240, letterSpacing: 2 };
const bounds = { width: 200, height: 56 };

test('all four corners scale typography while keeping the opposite corner fixed', () => {
  for (const handle of ['nw', 'ne', 'sw', 'se']) {
    const left = handle.includes('w'), top = handle.includes('n');
    const result = resizeTextLayer(layer, bounds, handle, left ? -200 : 200, top ? -56 : 56, 1080);
    assert.equal(result.size, 40);
    assert.equal(result.textWidth, 480);
    assert.equal(result.letterSpacing, 4);
    assert.equal(result.x + (left ? bounds.width * 2 : 0), layer.x + (left ? bounds.width : 0));
    assert.equal(result.y + (top ? bounds.height * 2 : 0), layer.y + (top ? bounds.height : 0));
  }
});

test('shrinking stays readable and crossing the anchor never flips text', () => {
  assert.equal(resizeTextLayer(layer, bounds, 'se', -100, -28, 1080).size, 10);
  const crossed = resizeTextLayer(layer, bounds, 'nw', 1000, 1000, 1080);
  assert.equal(crossed.size, 1);
  assert.ok(crossed.textWidth > 0);
  assert.equal(resizeTextLayer(layer, bounds, 'se', 100000, 100000, 1080).size, 1000);
});

test('automatic text width becomes explicit so moving a left corner preserves wrapping', () => {
  const result = resizeTextLayer({ ...layer, textWidth: undefined }, bounds, 'nw', -200, -56, 600);
  assert.equal(result.textWidth, (600 - layer.x - 20) * 2);
  assert.equal(layer.size, 20);
});
