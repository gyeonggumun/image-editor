import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDimensions, sharpenPixels, textLayout } from '../src/lib/imageTools.js';
import useEditorStore from '../src/store/useEditorStore.js';

test('rejects invalid and oversized canvas allocations', () => {
  for (const size of [[0, 100], [-1, 30], [1.5, 20], [8193, 2], [5000, 5000], [NaN, 100]]) assert.equal(validateDimensions(...size), false);
  assert.equal(validateDimensions(4000, 4000), true);
  assert.equal(validateDimensions(1, 8192), true);
});

test('resize scales all objects and undo/redo restores dimensions and original image', () => {
  const store = useEditorStore;
  store.setState(store.getInitialState(), true);
  const image = { naturalWidth: 800, naturalHeight: 600 };
  store.getState().setImage(image, 'photo.png');
  store.getState().addLayer();
  store.getState().addShape('rect');
  store.getState().addSticker('test');
  const original = store.getState();
  assert.equal(original.imageName, 'photo');
  assert.equal(original.resizeCanvas(400, 300), true);
  assert.equal(store.getState().layers[0].size, 16);
  assert.equal(store.getState().layers[0].textWidth, 200);
  assert.equal(store.getState().shapes[0].width, 75);
  assert.equal(store.getState().stickers[0].width, 50);
  store.getState().undo();
  assert.equal(store.getState().canvasWidth, 800);
  assert.equal(store.getState().layers[0].size, 32);
  assert.equal(store.getState().image, image);
  store.getState().redo();
  assert.equal(store.getState().canvasHeight, 300);
  const before = store.getState();
  assert.equal(before.resizeCanvas(8000, 8000), false);
  assert.equal(store.getState().canvasWidth, 400);
  store.getState().resizeCanvas(1000, 1000, false);
  assert.equal(store.getState().layers[0].size, 16);
});

test('image replacement is reversible including dimensions and filename', () => {
  useEditorStore.setState(useEditorStore.getInitialState(), true);
  useEditorStore.getState().setImage({ naturalWidth: 500, naturalHeight: 300 }, 'new.jpg');
  useEditorStore.getState().undo();
  assert.equal(useEditorStore.getState().image, null);
  assert.equal(useEditorStore.getState().canvasWidth, 1080);
  assert.equal(useEditorStore.getState().imageName, 'Untitled');
});

test('sharpening preserves uniform color and alpha, increases edge contrast', () => {
  const data = new Uint8ClampedArray(3 * 3 * 4).fill(100);
  const original = new Uint8ClampedArray(data);
  assert.deepEqual(sharpenPixels(data, 3, 3, 50), original);
  data[16] = 130;
  sharpenPixels(data, 3, 3, 25);
  assert.equal(data[16], 160);
  assert.equal(data[19], 100);
  assert.equal(data[0], 100);
});

test('text wrapping includes explicit newlines and sub-20px font metrics', () => {
  const context = { measureText: text => ({ width: Array.from(text).length * 4 }) };
  const result = textLayout(context, { text: '가나다\nABC', size: 8, x: 0, textWidth: 8, lineHeight: 1.5 }, 100);
  assert.deepEqual(result.lines, ['가나', '다', 'AB', 'C']);
  assert.equal(result.height, 48);
  assert.equal(context.font, '400 8px sans-serif');
});
