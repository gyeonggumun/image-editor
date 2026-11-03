import test from 'node:test';
import assert from 'node:assert/strict';
import { drawCrop, fitCrop, isValidCrop, moveCrop, resizeCrop } from '../src/lib/cropTools.js';
import useEditorStore from '../src/store/useEditorStore.js';

test('dragging in all directions creates the same pixel-aligned crop', () => {
  for (const [start, end] of [[{ x: 20, y: 30 }, { x: 220, y: 130 }], [{ x: 220, y: 130 }, { x: 20, y: 30 }], [{ x: 20, y: 130 }, { x: 220, y: 30 }], [{ x: 220, y: 30 }, { x: 20, y: 130 }]]) {
    assert.deepEqual(drawCrop(start, end, 800, 600), { x: 20, y: 30, width: 200, height: 100 });
  }
});

test('preset ratios fit inside the image and stay fixed while dragging', () => {
  assert.deepEqual(fitCrop(800, 600, 1), { x: 100, y: 0, width: 600, height: 600 });
  const rect = drawCrop({ x: 20, y: 30 }, { x: 720, y: 500 }, 800, 600, 1);
  assert.equal(rect.width, rect.height);
  assert.equal(isValidCrop(rect, 800, 600), true);
});

test('moving and all eight handles keep the crop within the canvas, including crossing anchors', () => {
  const rect = { x: 100, y: 80, width: 300, height: 200 };
  assert.deepEqual(moveCrop(rect, -900, 900, 800, 600), { x: 0, y: 400, width: 300, height: 200 });
  for (const handle of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) {
    for (const delta of [-1000, -50, 0, 50, 1000]) {
      for (const ratio of [0, 1, 4 / 5, 16 / 9, 9 / 16]) assert.equal(isValidCrop(resizeCrop(rect, handle, delta, delta, 800, 600, ratio), 800, 600), true);
    }
  }
});

test('crop preserves editable elements and filters, translates positions, and undoes as one change', () => {
  const store = useEditorStore;
  store.setState(store.getInitialState(), true);
  const original = { naturalWidth: 800, naturalHeight: 600 };
  const cropped = { naturalWidth: 400, naturalHeight: 300 };
  const layers = [{ id: 'text', text: 'ABC', x: 150, y: 100, size: 20 }];
  store.setState({ image: original, canvasWidth: 800, canvasHeight: 600, layers, shapes: [{ id: 'shape', x: 30, y: 80, width: 120, height: 50 }], stickers: [{ id: 'asset', x: 200, y: 150, width: 64, height: 64 }], imageFilters: { brightness: 120 }, selectedLayerIds: ['text'] });
  assert.equal(store.getState().cropCanvas(cropped, { x: 100, y: 50, width: 400, height: 300 }), true);
  let state = store.getState();
  assert.equal(state.layers[0].x, 50);
  assert.equal(state.layers[0].y, 50);
  assert.equal(state.layers[0].size, 20);
  assert.equal(state.layers[0].textWidth, 630);
  assert.equal(state.shapes[0].x, -70);
  assert.equal(state.shapes[0].width, 120);
  assert.equal(state.stickers[0].x, 100);
  assert.equal(state.imageFilters.brightness, 120);
  assert.equal(state.past.length, 1);
  assert.deepEqual(state.selectedLayerIds, []);
  state.undo();
  state = store.getState();
  assert.equal(state.image, original);
  assert.equal(state.canvasWidth, 800);
  assert.equal(state.layers, layers);
  state.redo();
  assert.equal(store.getState().image, cropped);
  assert.equal(store.getState().canvasWidth, 400);
});

test('invalid crop areas or mismatched output images leave the document untouched', () => {
  useEditorStore.setState(useEditorStore.getInitialState(), true);
  const before = useEditorStore.getState();
  assert.equal(before.cropCanvas({ naturalWidth: 400, naturalHeight: 300 }, { x: 1000, y: 0, width: 400, height: 300 }), false);
  assert.equal(before.cropCanvas({ naturalWidth: 1, naturalHeight: 1 }, { x: 0, y: 0, width: 400, height: 300 }), false);
  assert.equal(useEditorStore.getState(), before);
});
